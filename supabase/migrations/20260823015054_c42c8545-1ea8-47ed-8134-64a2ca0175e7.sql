CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  max_uses_per_user INTEGER,
  min_purchase_amount NUMERIC,
  auto_apply BOOLEAN NOT NULL DEFAULT false,
  applies_to_all BOOLEAN NOT NULL DEFAULT true,
  allowed_contexts TEXT[] NOT NULL DEFAULT '{main}',
  times_used INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coupons_code_unique ON public.coupons (upper(code));
CREATE INDEX idx_coupons_active ON public.coupons (is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_expires_at ON public.coupons (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_coupon_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(regexp_replace(trim(NEW.code), '\s+', '', 'g'));

  IF NEW.code !~ '^[A-Z0-9_-]{3,40}$' THEN
    RAISE EXCEPTION 'Código de cupom inválido. Use de 3 a 40 caracteres: letras, números, hífen ou underscore.';
  END IF;

  IF NEW.discount_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Tipo de desconto inválido.';
  END IF;

  IF NEW.discount_value IS NULL OR NEW.discount_value < 0 THEN
    RAISE EXCEPTION 'O valor do desconto não pode ser negativo.';
  END IF;

  IF NEW.discount_type = 'percentage' AND NEW.discount_value > 100 THEN
    RAISE EXCEPTION 'Desconto percentual não pode ser maior que 100%%.';
  END IF;

  IF NEW.min_purchase_amount IS NOT NULL AND NEW.min_purchase_amount < 0 THEN
    RAISE EXCEPTION 'O valor mínimo de compra não pode ser negativo.';
  END IF;

  IF NEW.max_uses IS NOT NULL AND NEW.max_uses < 1 THEN
    RAISE EXCEPTION 'O limite total de utilizações deve ser ao menos 1.';
  END IF;

  IF NEW.max_uses_per_user IS NOT NULL AND NEW.max_uses_per_user < 1 THEN
    RAISE EXCEPTION 'O limite por usuário deve ser ao menos 1.';
  END IF;

  IF NEW.starts_at IS NOT NULL AND NEW.expires_at IS NOT NULL AND NEW.expires_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'A data de término deve ser posterior à data de início.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coupon_fields
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.validate_coupon_fields();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coupon_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'course',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, product_id, product_type)
);

CREATE INDEX idx_coupon_products_coupon ON public.coupon_products (coupon_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupon_products TO authenticated;
GRANT ALL ON public.coupon_products TO service_role;

ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupon products" ON public.coupon_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT,
  product_type TEXT,
  context TEXT NOT NULL DEFAULT 'main',
  original_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_redemptions_coupon ON public.coupon_redemptions (coupon_id);
CREATE INDEX idx_redemptions_user ON public.coupon_redemptions (user_id, coupon_id);
CREATE INDEX idx_redemptions_status ON public.coupon_redemptions (status);
CREATE INDEX idx_redemptions_product ON public.coupon_redemptions (product_id, product_type);

GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage redemptions" ON public.coupon_redemptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_product_id TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_context TEXT DEFAULT 'main'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_total_uses INTEGER;
  v_uses_by_user INTEGER;
  v_discount NUMERIC := 0;
  v_final NUMERIC;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE upper(code) = upper(trim(COALESCE(p_code, '')));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found', 'message', 'Cupom não encontrado. Verifique o código e tente novamente.');
  END IF;

  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'inactive', 'message', 'Este cupom está inativo no momento.');
  END IF;

  IF v_coupon.starts_at IS NOT NULL AND v_now < v_coupon.starts_at THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_started', 'message', 'Este cupom ainda não está dentro do período de validade.');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_now > v_coupon.expires_at THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'message', 'Este cupom expirou.');
  END IF;

  SELECT count(*) INTO v_total_uses
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id
    AND (status = 'completed' OR (status = 'pending' AND created_at > v_now - INTERVAL '24 hours'));

  IF v_coupon.max_uses IS NOT NULL AND v_total_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'usage_limit', 'message', 'Este cupom atingiu o limite total de utilizações.');
  END IF;

  IF p_context IS NOT NULL AND NOT (p_context = ANY(v_coupon.allowed_contexts)) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'context_not_allowed', 'message', 'Este cupom não é válido para esta etapa da compra.');
  END IF;

  IF NOT v_coupon.applies_to_all AND p_product_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.coupon_products
      WHERE coupon_id = v_coupon.id
        AND product_id = p_product_id
        AND (p_product_type IS NULL OR product_type = p_product_type)
    ) THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'product_incompatible', 'message', 'Este cupom não é válido para este produto.');
    END IF;
  END IF;

  IF v_coupon.min_purchase_amount IS NOT NULL AND p_amount IS NOT NULL AND p_amount < v_coupon.min_purchase_amount THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'min_amount', 'message', 'Este cupom exige um valor mínimo de compra de R$ ' || to_char(v_coupon.min_purchase_amount, 'FM999G990D00') || '.');
  END IF;

  IF p_user_id IS NOT NULL AND v_coupon.max_uses_per_user IS NOT NULL THEN
    SELECT count(*) INTO v_uses_by_user
    FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id
      AND user_id = p_user_id
      AND (status = 'completed' OR (status = 'pending' AND created_at > v_now - INTERVAL '24 hours'));

    IF v_uses_by_user >= v_coupon.max_uses_per_user THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'user_limit', 'message', 'Você já utilizou este cupom o máximo de vezes permitido.');
    END IF;
  END IF;

  IF p_amount IS NOT NULL THEN
    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round(p_amount * v_coupon.discount_value / 100, 2);
    ELSE
      v_discount := LEAST(v_coupon.discount_value, p_amount);
    END IF;
    v_discount := GREATEST(0, LEAST(v_discount, p_amount));
    v_final := GREATEST(0, p_amount - v_discount);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', upper(v_coupon.code),
    'name', v_coupon.name,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'final_amount', v_final,
    'auto_apply', v_coupon.auto_apply
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_code TEXT,
  p_product_id TEXT,
  p_product_type TEXT,
  p_amount NUMERIC,
  p_user_id UUID,
  p_context TEXT DEFAULT 'main',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon_id UUID;
  v_validation JSONB;
  v_redemption_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'unauthenticated', 'message', 'É necessário estar logado para usar um cupom.');
  END IF;

  -- Trava a linha do cupom para serializar resgates simultâneos
  SELECT id INTO v_coupon_id
  FROM public.coupons
  WHERE upper(code) = upper(trim(COALESCE(p_code, '')))
  FOR UPDATE;

  IF v_coupon_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found', 'message', 'Cupom não encontrado. Verifique o código e tente novamente.');
  END IF;

  v_validation := public.validate_coupon(p_code, p_product_id, p_product_type, p_amount, p_user_id, p_context);

  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN v_validation;
  END IF;

  INSERT INTO public.coupon_redemptions (
    coupon_id, user_id, product_id, product_type, context,
    original_amount, discount_amount, final_amount, status, metadata
  )
  VALUES (
    v_coupon_id, p_user_id, p_product_id, p_product_type, COALESCE(p_context, 'main'),
    COALESCE(p_amount, 0),
    COALESCE((v_validation->>'discount_amount')::numeric, 0),
    COALESCE((v_validation->>'final_amount')::numeric, p_amount, 0),
    'pending',
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_redemption_id;

  UPDATE public.coupons SET times_used = times_used + 1, updated_at = now() WHERE id = v_coupon_id;

  RETURN jsonb_build_object(
    'valid', true,
    'redemption_id', v_redemption_id,
    'coupon_id', v_coupon_id,
    'code', v_validation->'code',
    'discount_type', v_validation->'discount_type',
    'discount_value', v_validation->'discount_value',
    'discount_amount', v_validation->'discount_amount',
    'final_amount', v_validation->'final_amount'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_coupon_redemption(
  p_user_id UUID,
  p_product_id TEXT,
  p_product_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupon_redemptions
  SET status = 'completed', completed_at = now()
  WHERE user_id = p_user_id
    AND product_id = p_product_id
    AND product_type = p_product_type
    AND status = 'pending';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_coupon(TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.complete_coupon_redemption(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_coupon_redemption(UUID, TEXT, TEXT) TO service_role;
CREATE TABLE public.ebook_download_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id text NOT NULL,
  ebook_title text,
  accepted_terms boolean NOT NULL DEFAULT true,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ebook_download_logs TO authenticated;
GRANT ALL ON public.ebook_download_logs TO service_role;

ALTER TABLE public.ebook_download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own download logs"
ON public.ebook_download_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ebook_download_logs_user ON public.ebook_download_logs (user_id, created_at DESC);
CREATE INDEX idx_ebook_download_logs_ebook ON public.ebook_download_logs (ebook_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.register_ebook_download(
  p_ebook_id text,
  p_accepted boolean,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_title text;
  v_per_ebook int;
  v_per_day int;
  v_email text;
  v_name text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated', 'message', 'É necessário estar logado para baixar o e-book.');
  END IF;

  IF p_accepted IS NOT TRUE THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'terms_not_accepted', 'message', 'É necessário aceitar os termos de direitos autorais.');
  END IF;

  SELECT title INTO v_title FROM public.ebooks WHERE id = p_ebook_id;
  IF v_title IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'not_found', 'message', 'E-book não encontrado.');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ebook_enrollments WHERE user_id = v_user AND ebook_id = p_ebook_id
  ) AND NOT public.has_role(v_user, 'admin') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_access', 'message', 'Você não possui acesso a este e-book.');
  END IF;

  SELECT count(*) INTO v_per_ebook FROM public.ebook_download_logs
   WHERE user_id = v_user AND ebook_id = p_ebook_id AND created_at > now() - interval '24 hours';

  SELECT count(*) INTO v_per_day FROM public.ebook_download_logs
   WHERE user_id = v_user AND created_at > now() - interval '24 hours';

  IF v_per_ebook >= 3 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'rate_limited', 'message', 'Limite de 3 downloads deste e-book nas últimas 24 horas atingido. Tente novamente mais tarde.');
  END IF;

  IF v_per_day >= 8 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'rate_limited', 'message', 'Limite diário de downloads atingido. Tente novamente mais tarde.');
  END IF;

  INSERT INTO public.ebook_download_logs (user_id, ebook_id, ebook_title, accepted_terms, ip_address, user_agent)
  VALUES (v_user, p_ebook_id, v_title, true, p_ip, left(coalesce(p_user_agent, ''), 400));

  SELECT email, name INTO v_email, v_name FROM public.profiles WHERE id = v_user;

  RETURN jsonb_build_object(
    'allowed', true,
    'ebook_title', v_title,
    'email', v_email,
    'name', v_name,
    'remaining_for_ebook', 3 - (v_per_ebook + 1),
    'remaining_today', 8 - (v_per_day + 1)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_ebook_download(text, boolean, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_ebook_download(text, boolean, text, text) TO authenticated, service_role;
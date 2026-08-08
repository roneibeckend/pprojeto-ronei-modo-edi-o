-- Adicionar suporte a indicações multinível
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.affiliates(id);

-- Tabela para materiais de marketing
CREATE TABLE IF NOT EXISTS public.affiliate_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'banner', -- banner, video, copy, etc
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para comissões personalizadas por curso
CREATE TABLE IF NOT EXISTS public.affiliate_custom_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
    course_id UUID NOT NULL, -- Removendo FK direta para evitar conflito UUID vs TEXT, validaremos via app
    commission_rate NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(affiliate_id, course_id)
);

-- Habilitar RLS
ALTER TABLE public.affiliate_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_custom_commissions ENABLE ROW LEVEL SECURITY;

-- Políticas para materiais de marketing
CREATE POLICY "Admin can manage materials" ON public.affiliate_materials
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view materials" ON public.affiliate_materials
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliates WHERE id = auth.uid() AND status = 'active'));

-- Políticas para comissões personalizadas
CREATE POLICY "Admin can manage custom commissions" ON public.affiliate_custom_commissions
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own custom commissions" ON public.affiliate_custom_commissions
    FOR SELECT TO authenticated USING (affiliate_id = auth.uid());

-- Grants
GRANT SELECT ON public.affiliate_materials TO authenticated;
GRANT ALL ON public.affiliate_materials TO service_role;

GRANT SELECT ON public.affiliate_custom_commissions TO authenticated;
GRANT ALL ON public.affiliate_custom_commissions TO service_role;

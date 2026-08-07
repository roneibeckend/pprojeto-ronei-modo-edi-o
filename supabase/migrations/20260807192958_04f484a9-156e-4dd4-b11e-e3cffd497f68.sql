CREATE TABLE public.financial_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_costs TO authenticated;
GRANT ALL ON public.financial_costs TO service_role;

ALTER TABLE public.financial_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage financial costs" 
ON public.financial_costs FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.financial_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_partners TO authenticated;
GRANT ALL ON public.financial_partners TO service_role;

ALTER TABLE public.financial_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage financial partners" 
ON public.financial_partners FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial data matching current UI state
INSERT INTO public.financial_costs (label, value) VALUES 
('Plataforma / hospedagem', 1200),
('Tráfego pago (ads)', 28000),
('Taxas de gateway', 8200),
('Produção de conteúdo', 6500),
('Suporte e equipe', 9800);

INSERT INTO public.financial_partners (name, percent) VALUES 
('Ronnei (Sócio fundador)', 50),
('Sócio operacional', 30),
('Sócio investidor', 20);
CREATE TABLE public.financial_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
    manual_revenue NUMERIC(15,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_settings TO authenticated;
GRANT ALL ON public.financial_settings TO service_role;

ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage financial settings" 
ON public.financial_settings FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.financial_settings (id, manual_revenue) VALUES ('00000000-0000-0000-0000-000000000000', 137240);
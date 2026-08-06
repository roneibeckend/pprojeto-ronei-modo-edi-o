-- Ensure RLS is enabled
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Delete old seeds to avoid duplicates if name was unique
DELETE FROM public.integrations WHERE name IN ('OpenAI', 'Google Gemini', 'Anthropic Claude', 'Mercado Pago', 'Stripe', 'Asaas');

-- Seed default integrations
INSERT INTO public.integrations (name, type, category, status, credentials, settings)
VALUES 
('OpenAI', 'ia', 'openai', true, '{"apiKey": ""}', '{"defaultModel": "gpt-4o"}'),
('Google Gemini', 'ia', 'gemini', false, '{"apiKey": ""}', '{"defaultModel": "gemini-pro"}'),
('Anthropic Claude', 'ia', 'anthropic', false, '{"apiKey": ""}', '{"defaultModel": "claude-3-opus"}'),
('Mercado Pago', 'payment', 'mercadopago', true, '{"publicKey": "", "accessToken": ""}', '{"testMode": true}'),
('Stripe', 'payment', 'stripe', false, '{"publishableKey": "", "secretKey": ""}', '{"testMode": true}'),
('Asaas', 'payment', 'asaas', false, '{"apiKey": ""}', '{"testMode": true}');

-- Policy to allow only admins to manage integrations
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.integrations;
CREATE POLICY "Admins can manage integrations"
ON public.integrations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT ALL ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

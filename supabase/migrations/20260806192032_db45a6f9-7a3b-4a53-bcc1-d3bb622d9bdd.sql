-- Add unique constraint
ALTER TABLE public.integrations ADD CONSTRAINT integrations_category_unique UNIQUE (category);

-- Insert data
INSERT INTO public.integrations (name, type, category, status, credentials, settings)
VALUES 
  ('Mercado Pago', 'payment', 'mercadopago', false, '{"publicKey": "", "accessToken": ""}', '{"environment": "sandbox"}'),
  ('Asaas', 'payment', 'asaas', false, '{"apiKey": ""}', '{"environment": "sandbox"}'),
  ('Stripe', 'payment', 'stripe', false, '{"publishableKey": "", "secretKey": ""}', '{"environment": "sandbox"}'),
  ('Gemini', 'ia', 'gemini', false, '{"apiKey": ""}', '{"defaultModel": "gemini-pro"}'),
  ('Claude', 'ia', 'claude', false, '{"apiKey": ""}', '{"defaultModel": "claude-3-opus-20240229"}'),
  ('DeepSeek', 'ia', 'deepseek', false, '{"apiKey": ""}', '{"defaultModel": "deepseek-chat"}' )
ON CONFLICT (category) DO NOTHING;

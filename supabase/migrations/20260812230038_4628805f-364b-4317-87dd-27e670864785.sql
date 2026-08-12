-- Tabela de Templates de E-mail
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    content_html TEXT NOT NULL,
    content_text TEXT,
    description TEXT,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Colunas de Validação em email_settings
ALTER TABLE public.email_settings ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';
ALTER TABLE public.email_settings ADD COLUMN IF NOT EXISTS last_validation_at TIMESTAMPTZ;
ALTER TABLE public.email_settings ADD COLUMN IF NOT EXISTS validation_error TEXT;

-- Inserir templates iniciais se não existirem
INSERT INTO public.email_templates (name, subject, content_html, description, variables)
VALUES 
('boas_vindas', 'Bem-vindo à nossa plataforma!', '<h1>Olá {{name}}!</h1><p>Estamos muito felizes em ter você conosco.</p>', 'E-mail enviado após o cadastro.', '["name"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.email_templates (name, subject, content_html, description, variables)
VALUES 
('acesso_liberado_produto', 'Seu acesso ao {{product_name}} foi liberado!', '<h1>Olá!</h1><p>Seu acesso ao produto {{product_name}} já está disponível.</p>', 'E-mail enviado após confirmação de pagamento.', '["product_name"]')
ON CONFLICT (name) DO NOTHING;
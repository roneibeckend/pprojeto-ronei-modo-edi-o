-- 1. Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications_opt_in BOOLEAN DEFAULT true;

-- 2. Create email_settings table
CREATE TABLE public.email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_name TEXT NOT NULL DEFAULT 'Suporte',
    from_email TEXT NOT NULL DEFAULT 'suporte@seudominio.com',
    reply_to TEXT,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email settings" ON public.email_settings
    FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 3. Create email_logs table
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, failed, bounced
    provider_message_id TEXT,
    error_message TEXT,
    payload JSONB,
    idempotency_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs" ON public.email_logs
    FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 4. Create email_templates_config table
CREATE TABLE public.email_templates_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates_config TO authenticated;
GRANT ALL ON public.email_templates_config TO service_role;
ALTER TABLE public.email_templates_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON public.email_templates_config
    FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 5. Seed initial data
INSERT INTO public.email_settings (from_name, from_email) 
VALUES ('Espetinho na Veia', 'contato@lead.espetinhonaveia.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates_config (template_name, subject) VALUES
('boas_vindas', 'Bem-vindo ao Espetinho na Veia! 🔥'),
('acesso_liberado_produto', 'Seu acesso foi liberado! 🚀'),
('conclusao_curso', 'Parabéns pela conclusão do curso! 🎓'),
('certificado_emitido', 'Seu certificado está pronto! 📜'),
('novo_conteudo', 'Tem conteúdo novo pra você! 👀'),
('suporte_recebido', 'Recebemos sua mensagem de suporte 💬')
ON CONFLICT (template_name) DO NOTHING;

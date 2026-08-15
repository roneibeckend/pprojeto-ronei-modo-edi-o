INSERT INTO public.email_settings (from_name, from_email, is_enabled)
SELECT 'Espetinho na Veia', 'contato@lead.espetinhonaveia.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.email_settings LIMIT 1);
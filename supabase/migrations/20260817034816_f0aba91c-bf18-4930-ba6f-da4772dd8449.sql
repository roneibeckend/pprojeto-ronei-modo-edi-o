-- Garantir um template padrão
INSERT INTO public.certificate_templates (id, name, is_default, is_active)
VALUES ('55eb616f-b60e-4ee0-a640-3d5772027a3d', 'Modelo Padrão', true, true)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_certificates TO authenticated;
GRANT ALL ON public.content_certificates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;
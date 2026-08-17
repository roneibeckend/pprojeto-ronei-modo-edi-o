-- Adicionar coluna para URL da imagem de fundo no template de certificado
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Adicionar coluna para identificar se é um template padrão
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Garantir privilégios
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

-- Adicionar coluna para URL da imagem de fundo no template de certificado
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Adicionar coluna para identificar se é um template padrão
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Adicionar coluna para versão/histórico (opcional, mas bom para o requisito de "voltar anterior")
-- Vamos usar uma abordagem de "status" ou apenas permitir múltiplos templates por curso
-- Na verdade, a tabela content_certificates já vincula um template a um conteúdo.

-- Garantir privilégios
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

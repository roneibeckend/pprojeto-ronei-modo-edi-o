-- Adicionar a coluna 'keywords' à tabela 'ebooks'
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';

-- Garantir privilégios
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;

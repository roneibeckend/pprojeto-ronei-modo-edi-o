-- Adiciona a coluna content à tabela ebooks para permitir armazenar o conteúdo do ebook em formato JSON ou Texto
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS content TEXT;

-- Garante que as permissões estejam corretas
GRANT SELECT, UPDATE ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;

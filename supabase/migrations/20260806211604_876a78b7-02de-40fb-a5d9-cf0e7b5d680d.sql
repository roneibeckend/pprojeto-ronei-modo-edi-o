-- 1. Ensure ebook_modules table exists
CREATE TABLE IF NOT EXISTS public.ebook_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebook_id TEXT NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grant access
GRANT SELECT ON public.ebook_modules TO authenticated;
GRANT ALL ON public.ebook_modules TO service_role;
ALTER TABLE public.ebook_modules ENABLE ROW LEVEL SECURITY;

-- 2. Update ebook_chapters table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ebook_chapters' AND column_name='module_id') THEN
        ALTER TABLE public.ebook_chapters ADD COLUMN module_id UUID REFERENCES public.ebook_modules(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ebook_chapters' AND column_name='slug') THEN
        ALTER TABLE public.ebook_chapters ADD COLUMN slug TEXT;
    END IF;
END $$;

-- 3. Update ebooks table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ebooks' AND column_name='video_url') THEN
        ALTER TABLE public.ebooks ADD COLUMN video_url TEXT;
    END IF;
END $$;

-- 4. Seed Data for 'guia-completo'
-- First, remove any existing modules for this ebook to ensure clean seed
DELETE FROM public.ebook_modules WHERE ebook_id = 'guia-completo';

-- Create 3 modules
WITH m1 AS (
    INSERT INTO public.ebook_modules (ebook_id, title, order_index)
    VALUES ('guia-completo', 'Fundamentos do Negócio', 0)
    RETURNING id
), m2 AS (
    INSERT INTO public.ebook_modules (ebook_id, title, order_index)
    VALUES ('guia-completo', 'Operação e Produção', 1)
    RETURNING id
), m3 AS (
    INSERT INTO public.ebook_modules (ebook_id, title, order_index)
    VALUES ('guia-completo', 'Marketing e Vendas', 2)
    RETURNING id
)
-- Create 3 chapters per module
INSERT INTO public.ebook_chapters (ebook_id, module_id, title, slug, content, order_index, reading_minutes)
SELECT 'guia-completo', m1.id, 'Visão Geral do Mercado', 'visao-geral', 'Conteúdo da visão geral... [SEED]', 0, 5 FROM m1
UNION ALL
SELECT 'guia-completo', m1.id, 'Planejamento Inicial', 'planejamento', 'Conteúdo do planejamento... [SEED]', 1, 10 FROM m1
UNION ALL
SELECT 'guia-completo', m1.id, 'Aspectos Legais', 'aspectos-legais', 'Conteúdo legal... [SEED]', 2, 7 FROM m1
UNION ALL
SELECT 'guia-completo', m2.id, 'Seleção de Carnes', 'selecao-carnes', 'Conteúdo sobre carnes... [SEED]', 0, 12 FROM m2
UNION ALL
SELECT 'guia-completo', m2.id, 'Técnicas de Corte', 'tecnicas-corte', 'Conteúdo sobre cortes... [SEED]', 1, 15 FROM m2
UNION ALL
SELECT 'guia-completo', m2.id, 'Segurança Alimentar', 'seguranca-alimentar', 'Conteúdo sobre segurança... [SEED]', 2, 8 FROM m2
UNION ALL
SELECT 'guia-completo', m3.id, 'Criação de Marca', 'criacao-marca', 'Conteúdo sobre marca... [SEED]', 0, 10 FROM m3
UNION ALL
SELECT 'guia-completo', m3.id, 'Redes Sociais', 'redes-sociais', 'Conteúdo sobre redes sociais... [SEED]', 1, 12 FROM m3
UNION ALL
SELECT 'guia-completo', m3.id, 'Atendimento ao Cliente', 'atendimento', 'Conteúdo sobre atendimento... [SEED]', 2, 6 FROM m3;

-- Update intro video
UPDATE public.ebooks SET video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ' WHERE id = 'guia-completo';

-- Ensure existing chapters have a slug if null (simple fallback)
UPDATE public.ebook_chapters SET slug = lower(replace(title, ' ', '-')) WHERE slug IS NULL;

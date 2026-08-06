-- Audit ebook_chapters for orphan records or missing data
SELECT ebook_id, count(*) FROM public.ebook_chapters GROUP BY ebook_id;

-- Seed data for validation (3 modules, 3 chapters each)
-- First, let's create a 'modules' table if we want a robust structure as requested.
-- "estrutura do banco de dados e do código suporte N módulos com N capítulos cada"

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

CREATE POLICY "Users can view modules of ebooks they are enrolled in"
ON public.ebook_modules FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.ebook_enrollments 
        WHERE ebook_enrollments.ebook_id = ebook_modules.ebook_id 
        AND ebook_enrollments.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role IN ('admin', 'manager', 'agent')
    )
);

-- Add module_id to ebook_chapters
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ebook_chapters' AND column_name='module_id') THEN
        ALTER TABLE public.ebook_chapters ADD COLUMN module_id UUID REFERENCES public.ebook_modules(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add video_url to ebooks if not present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ebooks' AND column_name='video_url') THEN
        ALTER TABLE public.ebooks ADD COLUMN video_url TEXT;
    END IF;
END $$;

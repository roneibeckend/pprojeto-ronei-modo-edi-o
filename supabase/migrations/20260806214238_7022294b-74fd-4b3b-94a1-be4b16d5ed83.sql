-- Corrigindo course_modules para usar TEXT como FK se courses.id for TEXT
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir que colunas existem em courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Tentar adicionar unique ao slug se não houver conflito
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_slug_key') THEN
        ALTER TABLE public.courses ADD CONSTRAINT courses_slug_key UNIQUE (slug);
    END IF;
END $$;

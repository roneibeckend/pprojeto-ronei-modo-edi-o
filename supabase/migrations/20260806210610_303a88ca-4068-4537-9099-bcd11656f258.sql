-- Create ebook_chapters table
CREATE TABLE IF NOT EXISTS public.ebook_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebook_id TEXT NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    order_index INT NOT NULL DEFAULT 0,
    reading_minutes INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create ebook_progress table
CREATE TABLE IF NOT EXISTS public.ebook_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.ebook_chapters(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, chapter_id)
);

-- Enable RLS
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_progress ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_progress TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;
GRANT ALL ON public.ebook_progress TO service_role;

-- RLS Policies for ebook_chapters
DROP POLICY IF EXISTS "Users can view chapters of ebooks they are enrolled in" ON public.ebook_chapters;
CREATE POLICY "Users can view chapters of ebooks they are enrolled in"
ON public.ebook_chapters
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.ebook_enrollments
        WHERE ebook_enrollments.ebook_id = ebook_chapters.ebook_id
        AND ebook_enrollments.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'manager', 'agent')
    )
);

-- RLS Policies for ebook_progress
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.ebook_progress;
CREATE POLICY "Users can manage their own progress"
ON public.ebook_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Migration of existing content
DO $$
BEGIN
    INSERT INTO public.ebook_chapters (ebook_id, title, content, order_index)
    SELECT id, 'Capítulo 1', content, 0
    FROM public.ebooks
    WHERE content IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.ebook_chapters WHERE ebook_chapters.ebook_id = ebooks.id);
END $$;

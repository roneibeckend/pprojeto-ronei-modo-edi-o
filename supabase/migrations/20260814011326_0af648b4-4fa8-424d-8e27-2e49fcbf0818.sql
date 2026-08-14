-- First, ensure the tables exist (they should, but being safe)
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    content TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fix RLS for course_modules
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage course modules" ON public.course_modules;
CREATE POLICY "Admins can manage course modules" 
ON public.course_modules 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can view course modules" ON public.course_modules;
CREATE POLICY "Students can view course modules" 
ON public.course_modules 
FOR SELECT 
TO authenticated
USING (true);

-- Fix RLS for course_lessons
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage course lessons" ON public.course_lessons;
CREATE POLICY "Admins can manage course lessons" 
ON public.course_lessons 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can view course lessons" ON public.course_lessons;
CREATE POLICY "Students can view course lessons" 
ON public.course_lessons 
FOR SELECT 
TO authenticated
USING (true);

-- GRANTS
GRANT ALL ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
GRANT ALL ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;

-- Add a dummy course if none exists to allow testing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.courses LIMIT 1) THEN
        INSERT INTO public.courses (id, title, slug, status, level)
        VALUES (gen_random_uuid(), 'Curso de Teste', 'curso-de-teste', 'draft', 'beginner');
    END IF;
END $$;

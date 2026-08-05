-- 1. Create access control table for courses with TEXT for course_id
CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- 2. Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 3. Grants
GRANT SELECT ON public.course_enrollments TO authenticated;
GRANT ALL ON public.course_enrollments TO service_role;

-- 4. Update Course Policies
DROP POLICY IF EXISTS "Everyone can view course catalog" ON public.courses;
CREATE POLICY "Everyone can view course catalog" 
ON public.courses FOR SELECT 
TO authenticated 
USING (true);

-- 5. Update Lesson Policies: Restrict access to enrolled users
DROP POLICY IF EXISTS "Authenticated users can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Enrolled users can view lessons" ON public.lessons;
CREATE POLICY "Enrolled users can view lessons" 
ON public.lessons FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.course_enrollments ce ON m.course_id = ce.course_id
        WHERE m.id = lessons.module_id
        AND ce.user_id = auth.uid()
    )
);

-- 6. Update Lesson Progress Policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.lesson_progress;
CREATE POLICY "Users can view own progress" 
ON public.lesson_progress FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.lesson_progress;
CREATE POLICY "Users can insert own progress" 
ON public.lesson_progress FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.lessons l
        JOIN public.modules m ON l.module_id = m.id
        JOIN public.course_enrollments ce ON m.course_id = ce.course_id
        WHERE l.id = lesson_progress.lesson_id
        AND ce.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update own progress" ON public.lesson_progress;
CREATE POLICY "Users can update own progress" 
ON public.lesson_progress FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Grant for lesson progress
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;

-- 8. Auto-enrollment for existing users
INSERT INTO public.course_enrollments (user_id, course_id)
SELECT p.id, c.id
FROM public.profiles p
CROSS JOIN public.courses c
ON CONFLICT DO NOTHING;

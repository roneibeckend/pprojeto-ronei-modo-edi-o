
-- Fix the type of lesson_progress.lesson_id to match course_lessons.id (UUID)
-- Step 1: Drop policies
DROP POLICY IF EXISTS "Users can insert own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can read own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.lesson_progress;

-- Step 2: Drop existing constraint
ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey;

-- Step 3: Alter type (converting text to uuid)
ALTER TABLE public.lesson_progress ALTER COLUMN lesson_id TYPE uuid USING lesson_id::uuid;

-- Step 4: Add back constraint with CASCADE
ALTER TABLE public.lesson_progress 
  ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;

-- Step 5: Restore policies
CREATE POLICY "Users can insert own progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Apply CASCADE to other relevant tables that already have compatible types
ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_course_id_fkey;
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.ebook_enrollments DROP CONSTRAINT IF EXISTS ebook_enrollments_ebook_id_fkey;
ALTER TABLE public.ebook_enrollments ADD CONSTRAINT ebook_enrollments_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.ebooks(id) ON DELETE CASCADE;

ALTER TABLE public.ebook_progress DROP CONSTRAINT IF EXISTS ebook_progress_chapter_id_fkey;
ALTER TABLE public.ebook_progress ADD CONSTRAINT ebook_progress_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.ebook_chapters(id) ON DELETE CASCADE;

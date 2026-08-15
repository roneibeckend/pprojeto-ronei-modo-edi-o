-- Drop existing unique indexes if they are not seen as constraints by Postgres (they were created as partial indexes)
DROP INDEX IF EXISTS public.course_feedback_user_course_unique;
DROP INDEX IF EXISTS public.course_feedback_user_ebook_unique;

-- Create explicit UNIQUE constraints that ON CONFLICT can target.
-- Since course_id and ebook_id are nullable, but the upsert logic uses them as conflict targets,
-- we ensure the constraints exist for those pairs.
ALTER TABLE public.course_feedback
ADD CONSTRAINT course_feedback_user_course_unique UNIQUE (user_id, course_id),
ADD CONSTRAINT course_feedback_user_ebook_unique UNIQUE (user_id, ebook_id);

-- Ensure correct permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_feedback TO authenticated;
GRANT ALL ON public.course_feedback TO service_role;
GRANT SELECT ON public.course_feedback TO anon;
ALTER TABLE public.course_feedback DROP CONSTRAINT IF EXISTS course_feedback_user_id_fkey;
ALTER TABLE public.course_feedback ADD CONSTRAINT course_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

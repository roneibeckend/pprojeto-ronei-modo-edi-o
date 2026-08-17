-- Replace the definer view approach with column-level privileges for anon
DROP VIEW IF EXISTS public.public_course_feedback;

-- Re-allow anonymous reads of approved feedback, but never the reviewer's user_id
CREATE POLICY "Public can view approved feedback"
ON public.course_feedback
FOR SELECT
TO anon
USING (status = 'approved');

REVOKE SELECT ON public.course_feedback FROM anon;
GRANT SELECT (id, course_id, ebook_id, rating, comment, admin_reply, status, created_at, updated_at)
ON public.course_feedback TO anon;
REVOKE SELECT ON public.course_feedback FROM anon;
GRANT SELECT (id, course_id, ebook_id, rating, comment, video_url, status, admin_reply, created_at, updated_at)
  ON public.course_feedback TO anon;
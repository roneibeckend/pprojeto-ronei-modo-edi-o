-- Final security hardening
-- Revoke all privileges on functions from public
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC;

-- Explicit policy for course_enrollments if still missing
DROP POLICY IF EXISTS "Users can view own enrollment" ON public.course_enrollments;
CREATE POLICY "Users can view own enrollment" 
ON public.course_enrollments FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

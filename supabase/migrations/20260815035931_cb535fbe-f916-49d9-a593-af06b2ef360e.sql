-- 1. Remove unused placeholder function callable by anon (SECURITY DEFINER, mutable search_path)
DROP FUNCTION IF EXISTS public.on_profile_created_send_welcome() CASCADE;

-- Tighten trigger helper functions: not meant to be called via the API
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_payout_requests_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Affiliates: column-level restriction for self-updates
REVOKE UPDATE ON public.affiliates FROM authenticated;
GRANT UPDATE (pix_key, bank_info, updated_at) ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;

-- 3. course_feedback: force pending status and no admin reply on user inserts
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.course_feedback;
CREATE POLICY "Users can insert their own feedback"
ON public.course_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
  AND admin_reply IS NULL
);

-- 4. modules (legacy): restrict to enrolled users or staff
DROP POLICY IF EXISTS "Modules are viewable by authenticated users" ON public.modules;
CREATE POLICY "Enrolled users and staff can view modules"
ON public.modules
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.course_id = public.modules.course_id
      AND ce.user_id = auth.uid()
  )
);

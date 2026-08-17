CREATE OR REPLACE FUNCTION public.has_any_enrollment(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.course_enrollments WHERE user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.ebook_enrollments WHERE user_id = _user_id)
$$;

REVOKE ALL ON FUNCTION public.has_any_enrollment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_any_enrollment(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view live_classes" ON public.live_classes;

CREATE POLICY "Enrolled students and staff can view live_classes"
ON public.live_classes
FOR SELECT
TO authenticated
USING (
  public.has_any_enrollment(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'agent')
);
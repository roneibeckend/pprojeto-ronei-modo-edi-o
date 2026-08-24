-- 1) Courses: hide draft/archived from regular students
DROP POLICY IF EXISTS "Everyone can view course catalog" ON public.courses;
DROP POLICY IF EXISTS "Users can view courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by authenticated users" ON public.courses;

CREATE POLICY "Published courses are viewable by authenticated users"
ON public.courses
FOR SELECT
TO authenticated
USING (
  coalesce(status, 'published') IN ('published', 'active')
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.course_id = courses.id AND ce.user_id = auth.uid()
  )
);

-- 2) Ebooks: hide non-active/unpublished from regular students
DROP POLICY IF EXISTS "Users can view ebooks" ON public.ebooks;

CREATE POLICY "Published ebooks are viewable by authenticated users"
ON public.ebooks
FOR SELECT
TO authenticated
USING (
  coalesce(status, 'published') IN ('published', 'active')
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.ebook_enrollments ee
    WHERE ee.ebook_id = ebooks.id AND ee.user_id = auth.uid()
  )
);

-- 3) Recipes: hide unpublished from regular students
DROP POLICY IF EXISTS "Recipes are viewable by all authenticated users" ON public.recipes;

CREATE POLICY "Published recipes are viewable by authenticated users"
ON public.recipes
FOR SELECT
TO authenticated
USING (
  coalesce(is_published, false) = true
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
);

-- 4) Remove unnecessary API exposure of an internal RLS helper
REVOKE EXECUTE ON FUNCTION public.has_any_enrollment(uuid) FROM authenticated, anon, PUBLIC;
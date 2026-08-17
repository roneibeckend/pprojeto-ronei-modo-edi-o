
-- 1. Restringir acesso a live_classes para alunos matriculados ou admins
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view live classes" ON public.live_classes;
    DROP POLICY IF EXISTS "Admins can manage live classes" ON public.live_classes;
    DROP POLICY IF EXISTS "Authenticated users can view live classes" ON public.live_classes;
    DROP POLICY IF EXISTS "View live classes restricted" ON public.live_classes;
    DROP POLICY IF EXISTS "Manage live classes staff only" ON public.live_classes;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Política para visualização: Admin ou Aluno Matriculado (tem registro em course_enrollments ou ebook_enrollments)
CREATE POLICY "View live classes restricted"
ON public.live_classes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'agent') OR
  EXISTS (SELECT 1 FROM public.course_enrollments WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.ebook_enrollments WHERE user_id = auth.uid())
);

-- Política para gestão: Apenas Admin/Equipe
CREATE POLICY "Manage live classes staff only"
ON public.live_classes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

GRANT SELECT ON public.live_classes TO authenticated;
GRANT ALL ON public.live_classes TO service_role;

-- 1. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_materials TO authenticated;
GRANT ALL ON public.platform_materials TO service_role;

-- 2. Drop existing policies to avoid duplicates or conflicts
DROP POLICY IF EXISTS "Enable all access for admins" ON public.platform_materials;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.platform_materials;

-- 3. Re-enable RLS just in case
ALTER TABLE public.platform_materials ENABLE ROW LEVEL SECURITY;

-- 4. Create explicit policy for all operations for admins
CREATE POLICY "Admins have full access to materials" 
ON public.platform_materials 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Create explicit read policy for students
CREATE POLICY "Students can view active materials" 
ON public.platform_materials 
FOR SELECT 
TO authenticated 
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

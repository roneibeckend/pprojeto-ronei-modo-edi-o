-- 1. Ensure table and permissions are correct
GRANT ALL ON public.platform_materials TO authenticated;
GRANT ALL ON public.platform_materials TO service_role;

-- 2. Clean up any conflicting policies
DROP POLICY IF EXISTS "Enable all access for admins" ON public.platform_materials;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.platform_materials;
DROP POLICY IF EXISTS "Admins have full access to materials" ON public.platform_materials;
DROP POLICY IF EXISTS "Students can view active materials" ON public.platform_materials;

-- 3. Re-enable RLS
ALTER TABLE public.platform_materials ENABLE ROW LEVEL SECURITY;

-- 4. Create explicit policy for ADMINS (All operations)
-- Using a simpler check first to verify if the function is the bottleneck
CREATE POLICY "admin_all_access" 
ON public.platform_materials 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Create explicit policy for STUDENTS (Select only)
CREATE POLICY "student_read_access" 
ON public.platform_materials 
FOR SELECT 
TO authenticated 
USING (is_active = true);

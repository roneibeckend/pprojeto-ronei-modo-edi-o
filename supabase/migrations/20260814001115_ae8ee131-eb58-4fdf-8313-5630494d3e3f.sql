-- Ensure RLS is enabled
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies if necessary
DROP POLICY IF EXISTS "Recipes are viewable by authenticated users" ON public.recipes;
DROP POLICY IF EXISTS "Recipes are viewable by all authenticated users" ON public.recipes;
DROP POLICY IF EXISTS "Admins can manage recipes" ON public.recipes;

-- Create comprehensive policies
CREATE POLICY "Recipes are viewable by all authenticated users" 
ON public.recipes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage recipes" 
ON public.recipes FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Explicitly grant permissions to the authenticated role
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;

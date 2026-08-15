-- 1. Remover política problemática
DROP POLICY IF EXISTS "Admins can manage email settings" ON public.email_settings;

-- 2. Criar políticas granulares para evitar falhas de contexto/recursividade
CREATE POLICY "Admins can select email settings" 
ON public.email_settings FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email settings" 
ON public.email_settings FOR INSERT 
TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email settings" 
ON public.email_settings FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email settings" 
ON public.email_settings FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Garantir privilégios (Supabase Data API requer GRANTs explícitos)
GRANT ALL ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;

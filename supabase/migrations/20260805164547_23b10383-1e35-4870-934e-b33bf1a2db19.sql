-- Habilitar a política de bootstrap para o primeiro administrador
-- Esta política permite que um usuário autenticado se torne o primeiro administrador se a tabela estiver vazia de admins.

CREATE POLICY "allow_first_admin_bootstrap"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE role = 'admin'
  )
);

-- Garantir que as permissões de INSERT estão mantidas para a role authenticated
GRANT INSERT ON public.user_roles TO authenticated;

-- 1. Alterar enum para incluir novas roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';

-- 2. Criar tabela de permissões granulares
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    can_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, module)
);

-- 3. Habilitar RLS e permissões
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;

-- 4. Política: Apenas admins podem ver e editar permissões
CREATE POLICY "Admins can manage admin_permissions"
ON public.admin_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Função para verificar permissão de módulo (Security Definer)
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id UUID, _module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admins têm acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
    UNION ALL
    -- Outros perfis dependem da tabela de permissões
    SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND module = _module AND can_access = TRUE
  );
$$;

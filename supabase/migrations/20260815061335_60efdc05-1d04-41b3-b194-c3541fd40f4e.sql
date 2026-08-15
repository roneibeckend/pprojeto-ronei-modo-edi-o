-- Aumentar permissões da tabela integrations para garantir que o service_role e admins possam gerenciar
GRANT ALL ON public.integrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;

-- Garantir que a RLS esteja habilitada
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Verificar e criar/corrigir a política para administradores
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'integrations' AND policyname = 'Admins can manage integrations'
    ) THEN
        CREATE POLICY "Admins can manage integrations"
        ON public.integrations
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
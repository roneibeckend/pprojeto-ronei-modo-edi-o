-- Adicionar coluna user_id na tabela financial_partners
ALTER TABLE public.financial_partners ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Garantir que a coluna esteja acessível
GRANT SELECT, INSERT, UPDATE ON public.financial_partners TO authenticated;

-- Tentar vincular o primeiro sócio ao admin para testes (se existir)
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Buscamos pelo profile já que temos acesso a public.profiles
    SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'newdroidsk8@gmail.com' LIMIT 1;
    
    IF v_admin_id IS NOT NULL THEN
        UPDATE public.financial_partners 
        SET user_id = v_admin_id 
        WHERE name ILIKE '%Ronnei%';
    END IF;
END $$;

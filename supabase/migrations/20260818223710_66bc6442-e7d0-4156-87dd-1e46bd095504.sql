
-- Adicionar coluna total_earned se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_balances' AND column_name = 'total_earned') THEN
        ALTER TABLE public.partner_balances ADD COLUMN total_earned numeric(10,2) DEFAULT 0;
    END IF;
END
$$;

-- Recriar a função distribute_partner_profits garantindo o uso correto da coluna total_earned
CREATE OR REPLACE FUNCTION public.distribute_partner_profits(
    p_amount numeric,
    p_partner_id uuid
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Garantir que o registro exista para o sócio
    INSERT INTO public.partner_balances (user_id, balance, total_earned, total_withdrawn)
    VALUES (p_partner_id, p_amount, p_amount, 0)
    ON CONFLICT (user_id) DO UPDATE 
    SET balance = partner_balances.balance + p_amount,
        total_earned = COALESCE(partner_balances.total_earned, 0) + p_amount,
        updated_at = now();
END;
$$;

-- Garantir que as permissões estejam corretas
GRANT ALL ON public.partner_balances TO service_role;
GRANT SELECT, UPDATE ON public.partner_balances TO authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) TO authenticated;

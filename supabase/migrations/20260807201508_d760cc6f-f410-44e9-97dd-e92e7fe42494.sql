DROP FUNCTION IF EXISTS public.distribute_partner_profits(numeric, uuid);

CREATE OR REPLACE FUNCTION public.distribute_partner_profits(p_amount numeric, p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- p_partner_id agora deve ser o user_id real (auth.users.id)
    IF EXISTS (SELECT 1 FROM public.partner_balances WHERE user_id = p_partner_id) THEN
        UPDATE public.partner_balances
        SET 
            balance = balance + p_amount,
            updated_at = now()
        WHERE user_id = p_partner_id;
    ELSE
        INSERT INTO public.partner_balances (user_id, balance, withdrawn, updated_at)
        VALUES (p_partner_id, p_amount, 0, now());
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) TO service_role;

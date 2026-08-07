-- Função para incrementar o total retirado de um sócio
CREATE OR REPLACE FUNCTION public.increment_partner_withdrawn(
    p_user_id uuid,
    p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.partner_balances
    SET total_withdrawn = total_withdrawn + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_partner_withdrawn TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_partner_withdrawn TO service_role;

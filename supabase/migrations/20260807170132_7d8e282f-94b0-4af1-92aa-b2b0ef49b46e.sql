
-- Função para incrementar ganhos do afiliado de forma atômica
CREATE OR REPLACE FUNCTION public.increment_affiliate_earnings(aff_id uuid, amount_to_add decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.affiliates
    SET total_earnings = total_earnings + amount_to_add,
        balance = balance + amount_to_add,
        updated_at = now()
    WHERE id = aff_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_affiliate_earnings(uuid, decimal) TO service_role;

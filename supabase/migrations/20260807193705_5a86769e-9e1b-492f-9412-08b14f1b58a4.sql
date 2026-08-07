-- 1. Tabela de Saldos de Sócios
CREATE TABLE public.partner_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_withdrawn numeric(12,2) DEFAULT 0.00 NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- 2. Permissões (Grants)
GRANT SELECT, INSERT, UPDATE ON public.partner_balances TO authenticated;
GRANT ALL ON public.partner_balances TO service_role;

-- 3. RLS
ALTER TABLE public.partner_balances ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio saldo
CREATE POLICY "Users can view their own partner balance"
ON public.partner_balances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: Admins podem gerenciar todos os saldos
CREATE POLICY "Admins can manage all partner balances"
ON public.partner_balances
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Função para processar distribuição de lucros
CREATE OR REPLACE FUNCTION public.distribute_partner_profits(
    p_amount numeric,
    p_partner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Upsert no saldo do sócio
    INSERT INTO public.partner_balances (user_id, balance)
    VALUES (p_partner_id, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        balance = public.partner_balances.balance + p_amount,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.distribute_partner_profits TO authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_partner_profits TO service_role;

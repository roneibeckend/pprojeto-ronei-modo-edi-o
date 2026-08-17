-- 1. Idempotência Asaas
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text UNIQUE NOT NULL,
    payment_id text NOT NULL,
    event_type text NOT NULL,
    status text DEFAULT 'processing',
    payload jsonb,
    claim_token text,
    processed_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.acquire_asaas_webhook_claim(
    p_event_id text,
    p_payment_id text,
    p_event_type text,
    p_payload jsonb
) RETURNS TABLE (claim_token text) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    v_token text;
BEGIN
    -- Check if already exists and completed
    IF EXISTS (SELECT 1 FROM public.asaas_webhook_events WHERE event_id = p_event_id AND status = 'completed') THEN
        RETURN;
    END IF;

    v_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.asaas_webhook_events (event_id, payment_id, event_type, payload, claim_token, status)
    VALUES (p_event_id, p_payment_id, p_event_type, p_payload, v_token, 'processing')
    ON CONFLICT (event_id) DO UPDATE 
    SET claim_token = v_token,
        status = 'processing',
        created_at = now()
    WHERE asaas_webhook_events.status != 'completed';

    IF FOUND THEN
        RETURN QUERY SELECT v_token;
    END IF;
END;
$$;

-- 2. Distribuição de Lucros
CREATE TABLE IF NOT EXISTS public.partner_balances (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance numeric(10,2) DEFAULT 0,
    total_earned numeric(10,2) DEFAULT 0,
    total_withdrawn numeric(10,2) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.distribute_partner_profits(
    p_amount numeric,
    p_partner_id uuid
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.partner_balances (user_id, balance, total_earned)
    VALUES (p_partner_id, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE 
    SET balance = partner_balances.balance + p_amount,
        total_earned = partner_balances.total_earned + p_amount,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_partner_withdrawn(
    p_user_id uuid,
    p_amount numeric
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.partner_balances 
    SET total_withdrawn = total_withdrawn + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;

-- 3. Logs de Integração (se não existir colunas essenciais)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_logs' AND column_name = 'message') THEN
        ALTER TABLE public.integration_logs ADD COLUMN message text;
    END IF;
END $$;

-- 4. Permissões
GRANT ALL ON public.asaas_webhook_events TO service_role;
GRANT ALL ON public.partner_balances TO service_role;
GRANT SELECT ON public.partner_balances TO authenticated;
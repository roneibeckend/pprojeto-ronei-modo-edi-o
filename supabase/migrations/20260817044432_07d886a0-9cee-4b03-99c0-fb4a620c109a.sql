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

GRANT ALL ON public.asaas_webhook_events TO service_role;
DO $$ BEGIN
    ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Gestão de Sócios
CREATE TABLE IF NOT EXISTS public.partner_balances (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance numeric(10,2) DEFAULT 0,
    total_earned numeric(10,2) DEFAULT 0,
    total_withdrawn numeric(10,2) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, UPDATE ON public.partner_balances TO authenticated;
GRANT ALL ON public.partner_balances TO service_role;
DO $$ BEGIN
    ALTER TABLE public.partner_balances ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_balances' AND policyname = 'Partners can see their own balance') THEN
        CREATE POLICY "Partners can see their own balance" 
        ON public.partner_balances FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. RPCs Críticas
CREATE OR REPLACE FUNCTION public.acquire_asaas_webhook_claim(
    p_event_id text,
    p_payment_id text,
    p_event_type text,
    p_payload jsonb
) RETURNS TABLE (claim_token text) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token text;
BEGIN
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

CREATE OR REPLACE FUNCTION public.distribute_partner_profits(
    p_amount numeric,
    p_partner_id uuid
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
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

-- 4. Logs e Colunas Faltantes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_logs' AND column_name = 'message') THEN
        ALTER TABLE public.integration_logs ADD COLUMN message text;
    END IF;
END $$;

-- Ajustando report_settings para o esquema existente (emails -> send_time, etc)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_settings' AND column_name = 'recipients') THEN
        ALTER TABLE public.report_settings ADD COLUMN recipients text[];
    END IF;
END $$;
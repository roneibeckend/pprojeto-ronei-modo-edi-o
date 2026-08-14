-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Atomic claim function for Asaas webhooks
-- Using SECURITY DEFINER to allow service_role/admin bypass of RLS for this specific operation
CREATE OR REPLACE FUNCTION public.acquire_asaas_webhook_claim(
    p_event_id TEXT,
    p_payment_id TEXT,
    p_event_type TEXT,
    p_payload JSONB,
    p_lease_interval INTERVAL DEFAULT INTERVAL '5 minutes'
)
RETURNS TABLE (
    claim_token UUID,
    status TEXT,
    claimed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_claim_token UUID := gen_random_uuid();
    v_now TIMESTAMPTZ := now();
BEGIN
    -- Try to insert a new event record
    INSERT INTO public.asaas_webhook_events (
        event_id,
        payment_id,
        event_type,
        status,
        claim_token,
        claimed_at,
        payload
    )
    VALUES (
        p_event_id,
        p_payment_id,
        p_event_type,
        'processing',
        v_claim_token,
        v_now,
        p_payload
    )
    ON CONFLICT (event_id) DO UPDATE
    SET
        status = 'processing',
        claim_token = v_claim_token,
        claimed_at = v_now,
        last_error = NULL
    WHERE
        -- Only reclaim if failed or lease expired
        asaas_webhook_events.status = 'failed'
        OR (
            asaas_webhook_events.status = 'processing'
            AND asaas_webhook_events.claimed_at < v_now - p_lease_interval
        )
    -- This condition ensures only ONE request wins the race
    RETURNING 
        asaas_webhook_events.claim_token, 
        asaas_webhook_events.status, 
        asaas_webhook_events.claimed_at
    INTO claim_token, status, claimed_at;

    -- If no row was returned (conflict not meeting WHERE condition), return TABLE values
    RETURN NEXT;
END;
$$;

-- 3. Update table schema to include claim_token and other required fields
-- We recreate the table structure to be precise
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    event_id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    claim_token UUID,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    payload JSONB
);

-- Ensure correct columns if table already existed partially
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asaas_webhook_events' AND column_name = 'claim_token') THEN
        ALTER TABLE public.asaas_webhook_events ADD COLUMN claim_token UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asaas_webhook_events' AND column_name = 'event_type') THEN
        ALTER TABLE public.asaas_webhook_events ADD COLUMN event_type TEXT;
    END IF;
END $$;

-- Policies and Permissions
GRANT SELECT, INSERT, UPDATE ON public.asaas_webhook_events TO authenticated;
GRANT ALL ON public.asaas_webhook_events TO service_role;
REVOKE ALL ON FUNCTION public.acquire_asaas_webhook_claim FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_asaas_webhook_claim TO authenticated, service_role;

ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.asaas_webhook_events;
CREATE POLICY "Admins can view webhook logs" 
ON public.asaas_webhook_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Ensure index for performance
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_status_claimed ON public.asaas_webhook_events (status, claimed_at);

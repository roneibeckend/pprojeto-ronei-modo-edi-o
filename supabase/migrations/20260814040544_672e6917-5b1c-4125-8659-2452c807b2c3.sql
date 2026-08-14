CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    event_id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    payload JSONB
);

GRANT SELECT, INSERT, UPDATE ON public.asaas_webhook_events TO authenticated;
GRANT ALL ON public.asaas_webhook_events TO service_role;

ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.asaas_webhook_events;
CREATE POLICY "Admins can view webhook logs" 
ON public.asaas_webhook_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_asaas_webhook_status_claimed ON public.asaas_webhook_events (status, claimed_at);
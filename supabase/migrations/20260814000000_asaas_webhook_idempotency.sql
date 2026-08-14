-- Create a table to track processed webhook events from Asaas
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    event_id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB
);

-- Grant access
GRANT SELECT, INSERT ON public.asaas_webhook_events TO authenticated;
GRANT ALL ON public.asaas_webhook_events TO service_role;

-- Enable RLS
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view webhook logs" 
ON public.asaas_webhook_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

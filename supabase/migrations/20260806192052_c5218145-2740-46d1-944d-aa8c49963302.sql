-- Create integration_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    latency TEXT,
    details JSONB DEFAULT '{}',
    http_code INTEGER,
    endpoint TEXT,
    environment TEXT,
    response_body JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.integration_logs TO authenticated;
GRANT ALL ON public.integration_logs TO service_role;

-- Policies for logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view integration logs') THEN
        CREATE POLICY "Admins can view integration logs" ON public.integration_logs
            FOR SELECT
            TO authenticated
            USING (public.has_role(auth.uid(), 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can insert logs') THEN
        CREATE POLICY "Authenticated can insert logs" ON public.integration_logs
            FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

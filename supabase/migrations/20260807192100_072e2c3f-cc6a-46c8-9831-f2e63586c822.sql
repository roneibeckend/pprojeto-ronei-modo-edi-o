-- Create Payout Status Enum
DO $$ BEGIN
    CREATE TYPE public.payout_status AS ENUM ('pending', 'analyzing', 'approved', 'paid', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Payout Requests Table
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    status public.payout_status NOT NULL DEFAULT 'pending',
    method TEXT NOT NULL,
    pix_key TEXT,
    asaas_payment_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- Permissions
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;

-- RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own payout requests" 
    ON public.payout_requests FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create their own payout requests" 
    ON public.payout_requests FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage all payout requests" 
    ON public.payout_requests FOR ALL 
    TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_payout_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payout_requests_updated_at ON public.payout_requests;
CREATE TRIGGER trigger_update_payout_requests_updated_at
BEFORE UPDATE ON public.payout_requests
FOR EACH ROW EXECUTE FUNCTION update_payout_requests_updated_at();

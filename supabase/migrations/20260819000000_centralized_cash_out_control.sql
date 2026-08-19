-- Create asaas_transfers table
CREATE TABLE IF NOT EXISTS public.asaas_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asaas_id TEXT UNIQUE, -- Nullable for manual entries
    amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'transfer', -- 'transfer' (Asaas) or 'manual'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (admins will be restricted by policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_transfers TO authenticated;
GRANT ALL ON public.asaas_transfers TO service_role;

-- Policies: only admins can manage transfers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'asaas_transfers' 
        AND policyname = 'Admins can manage all transfers'
    ) THEN
        CREATE POLICY "Admins can manage all transfers" 
        ON public.asaas_transfers
        FOR ALL 
        TO authenticated 
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_date ON public.asaas_transfers(transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_type ON public.asaas_transfers(transaction_type);

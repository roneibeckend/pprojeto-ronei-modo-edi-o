-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    net_amount NUMERIC(12,2) NOT NULL,
    fee NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL,
    billing_type TEXT,
    external_reference TEXT,
    customer_id TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payments' AND policyname = 'Admins can manage all payments'
    ) THEN
        CREATE POLICY "Admins can manage all payments" 
        ON public.payments 
        TO authenticated 
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Add total_revenue column to financial_settings for caching
ALTER TABLE public.financial_settings ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(15,2) DEFAULT 0;

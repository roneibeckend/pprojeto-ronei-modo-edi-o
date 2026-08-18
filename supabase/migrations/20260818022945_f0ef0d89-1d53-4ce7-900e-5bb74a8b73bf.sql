
CREATE TABLE public.asaas_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asaas_id text UNIQUE,
    amount numeric NOT NULL,
    status text NOT NULL,
    transfer_date timestamp with time zone NOT NULL DEFAULT now(),
    description text,
    transaction_type text DEFAULT 'transfer',
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_transfers TO authenticated;
GRANT ALL ON public.asaas_transfers TO service_role;

ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transfers"
ON public.asaas_transfers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Hardening RLS for asaas_transfers
ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage transfers" ON public.asaas_transfers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can manage transfers" 
ON public.asaas_transfers 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.asaas_transfers TO authenticated;
GRANT ALL ON public.asaas_transfers TO service_role;

-- Hardening RLS for payout_requests
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage payout requests" ON public.payout_requests;
  DROP POLICY IF EXISTS "Users can see their own payouts" ON public.payout_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can manage payout requests" 
ON public.payout_requests 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can see their own payouts"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

GRANT ALL ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;

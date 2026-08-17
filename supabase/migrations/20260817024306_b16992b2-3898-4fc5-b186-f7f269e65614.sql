DROP POLICY IF EXISTS "Users can register as affiliates" ON public.affiliates;

CREATE POLICY "Users can register as affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND status = 'pending'::affiliate_status
  AND balance = 0
  AND total_earnings = 0
  AND commission_rate = 30
  AND referrer_id IS NULL
);
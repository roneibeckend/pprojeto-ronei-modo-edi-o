CREATE OR REPLACE FUNCTION public.affiliate_sensitive_fields_unchanged(
  _id uuid,
  _status affiliate_status,
  _commission_rate numeric,
  _balance numeric,
  _total_earnings numeric,
  _referrer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = _id
      AND a.status = _status
      AND a.commission_rate = _commission_rate
      AND a.balance = _balance
      AND a.total_earnings = _total_earnings
      AND a.referrer_id IS NOT DISTINCT FROM _referrer_id
  )
$$;

REVOKE ALL ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can update their own affiliate profile" ON public.affiliates;

CREATE POLICY "Users can update their own affiliate profile"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND public.affiliate_sensitive_fields_unchanged(
    id, status, commission_rate, balance, total_earnings, referrer_id
  )
);
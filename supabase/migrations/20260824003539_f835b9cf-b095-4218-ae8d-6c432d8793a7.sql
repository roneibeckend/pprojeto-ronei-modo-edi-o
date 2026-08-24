REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, text) FROM authenticated, anon, PUBLIC;

DROP POLICY IF EXISTS "Users can update their own affiliate profile" ON public.affiliates;
CREATE POLICY "Users can update their own affiliate profile"
ON public.affiliates FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

REVOKE EXECUTE ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, public.affiliate_status, numeric, numeric, numeric, uuid) FROM authenticated, anon, PUBLIC;
DROP FUNCTION IF EXISTS public.affiliate_sensitive_fields_unchanged(uuid, public.affiliate_status, numeric, numeric, numeric, uuid);
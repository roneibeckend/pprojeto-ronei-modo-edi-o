-- Revogar acesso público à função sensitive affiliate com assinatura completa
REVOKE EXECUTE ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) TO authenticated, service_role;

-- Restringir execução da função de automação de status
REVOKE ALL ON FUNCTION public.update_expired_live_classes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_expired_live_classes() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_expired_live_classes() TO service_role;
-- Secure sync_report_cron
ALTER FUNCTION public.sync_report_cron() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.sync_report_cron() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_report_cron() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_report_cron() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_report_cron() TO postgres;
GRANT EXECUTE ON FUNCTION public.sync_report_cron() TO service_role;

-- Secure sync_pwa_assets if it exists (guessing from linter results)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_pwa_assets') THEN
        ALTER FUNCTION public.sync_pwa_assets() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.sync_pwa_assets() FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.sync_pwa_assets() FROM authenticated;
        REVOKE EXECUTE ON FUNCTION public.sync_pwa_assets() FROM anon;
        GRANT EXECUTE ON FUNCTION public.sync_pwa_assets() TO postgres;
        GRANT EXECUTE ON FUNCTION public.sync_pwa_assets() TO service_role;
    END IF;
END $$;
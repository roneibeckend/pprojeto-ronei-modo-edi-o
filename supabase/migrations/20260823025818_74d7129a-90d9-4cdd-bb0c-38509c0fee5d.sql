-- 1) Revoke execute from PUBLIC/anon/authenticated on ALL security definer functions in public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- 2) Re-grant only what the app legitimately calls as the signed-in user (or in RLS policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_enrollment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.request_payout_atomic(numeric, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payout(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_payout_status(uuid, payout_status, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_payout_document(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_ranking_campaign(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_ebook_completion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_ranking_v2(integer, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_ranking(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_system_event(text, text, text, jsonb) TO authenticated;
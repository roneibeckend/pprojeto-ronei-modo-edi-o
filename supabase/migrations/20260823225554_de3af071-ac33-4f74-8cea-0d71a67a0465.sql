DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.get_student_ranking(integer) FROM authenticated;
REVOKE ALL ON FUNCTION public.log_system_event(text, text, text, jsonb) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_enrollment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, public.affiliate_status, numeric, numeric, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_ebook_download(text, boolean, text, text) TO authenticated;
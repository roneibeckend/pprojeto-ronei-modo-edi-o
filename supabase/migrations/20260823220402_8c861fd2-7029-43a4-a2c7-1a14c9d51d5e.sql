-- 1) Impedir que usuários gravem pontos arbitrários em progress_tracking
CREATE OR REPLACE FUNCTION public.protect_progress_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.points_awarded := 0;
    NEW.last_milestone := 0;
  ELSE
    NEW.points_awarded := OLD.points_awarded;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aa_protect_progress_points ON public.progress_tracking;
CREATE TRIGGER aa_protect_progress_points
BEFORE INSERT OR UPDATE ON public.progress_tracking
FOR EACH ROW EXECUTE FUNCTION public.protect_progress_points();

-- 2) Revogar EXECUTE de anon/authenticated em funções SECURITY DEFINER que não
--    precisam ser chamadas diretamente pelo cliente.
DO $$
DECLARE
  r record;
  -- funções chamadas com a sessão do usuário ou usadas dentro de políticas RLS
  keep_authenticated text[] := ARRAY[
    'has_role','has_module_access','has_any_enrollment',
    'affiliate_sensitive_fields_unchanged',
    'request_payout_atomic','cancel_payout','admin_set_payout_status',
    'admin_request_payout_document','finish_ranking_campaign',
    'finalize_ebook_completion','log_system_event',
    'get_student_ranking','get_student_ranking_v2','validate_coupon'
  ];
  keep_anon text[] := ARRAY[
    'has_role','has_module_access','has_any_enrollment',
    'affiliate_sensitive_fields_unchanged'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    IF NOT (r.proname = ANY(keep_anon)) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    END IF;
    IF NOT (r.proname = ANY(keep_authenticated)) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.sig);
    END IF;
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  FOREACH r.proname IN ARRAY keep_authenticated LOOP
    NULL;
  END LOOP;
END $$;

-- Regrantear explicitamente as funções mantidas (evita perda por REVOKE FROM PUBLIC)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN ('has_role','has_module_access','has_any_enrollment',
        'affiliate_sensitive_fields_unchanged','request_payout_atomic','cancel_payout',
        'admin_set_payout_status','admin_request_payout_document','finish_ranking_campaign',
        'finalize_ebook_completion','log_system_event','get_student_ranking',
        'get_student_ranking_v2','validate_coupon')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    IF r.proname IN ('has_role','has_module_access','has_any_enrollment','affiliate_sensitive_fields_unchanged') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
    END IF;
  END LOOP;
END $$;
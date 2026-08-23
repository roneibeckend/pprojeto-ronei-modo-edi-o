-- Retenção de logs do sistema: mantém no máximo 1000 registros e 14 dias
CREATE OR REPLACE FUNCTION public.prune_system_logs(p_max_rows integer DEFAULT 1000, p_max_age interval DEFAULT interval '14 days')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
  v_count integer := 0;
BEGIN
  DELETE FROM public.system_logs WHERE created_at < now() - p_max_age;
  v_deleted := ROW_COUNT_HACK();
  RETURN v_deleted;
END;
$$;

-- versão correta (substitui a acima)
CREATE OR REPLACE FUNCTION public.prune_system_logs(p_max_rows integer DEFAULT 1000, p_max_age interval DEFAULT interval '14 days')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
  v_tmp integer := 0;
BEGIN
  DELETE FROM public.system_logs WHERE created_at < now() - p_max_age;
  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_deleted := v_deleted + v_tmp;

  DELETE FROM public.system_logs
  WHERE id IN (
    SELECT id FROM public.system_logs
    ORDER BY created_at DESC
    OFFSET GREATEST(p_max_rows, 0)
  );
  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_deleted := v_deleted + v_tmp;

  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_system_logs(integer, interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_system_logs(integer, interval) TO service_role;

-- Poda automática após inserções (amostragem para não pesar)
CREATE OR REPLACE FUNCTION public.system_logs_autoprune()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF random() < 0.05 THEN
    PERFORM public.prune_system_logs();
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS zz_system_logs_autoprune ON public.system_logs;
CREATE TRIGGER zz_system_logs_autoprune
AFTER INSERT ON public.system_logs
FOR EACH STATEMENT EXECUTE FUNCTION public.system_logs_autoprune();

-- Agendamento diário de limpeza
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('prune-system-logs') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'prune-system-logs'
    );
    PERFORM cron.schedule('prune-system-logs', '17 4 * * *', $cmd$SELECT public.prune_system_logs();$cmd$);
  END IF;
END $$;

-- Limpeza imediata
SELECT public.prune_system_logs();
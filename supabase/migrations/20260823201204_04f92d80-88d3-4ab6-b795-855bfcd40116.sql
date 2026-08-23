CREATE OR REPLACE FUNCTION public.sync_report_cron()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_hour INT;
  v_minute INT;
  v_utc_hour INT;
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily_financial_report');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF COALESCE(NEW.enabled, true) THEN
    v_hour := COALESCE(NULLIF(split_part(COALESCE(NEW.send_time, '08:00'), ':', 1), '')::int, 8);
    v_minute := COALESCE(NULLIF(split_part(COALESCE(NEW.send_time, '08:00'), ':', 2), '')::int, 0);
    -- send_time é local (America/Sao_Paulo, UTC-3); pg_cron roda em UTC
    v_utc_hour := (v_hour + 3) % 24;

    PERFORM cron.schedule(
      'daily_financial_report',
      v_minute || ' ' || v_utc_hour || ' * * *',
      'SELECT public.trigger_daily_report()'
    );
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_report_cron() FROM PUBLIC;
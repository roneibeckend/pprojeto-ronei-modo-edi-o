ALTER TABLE public.report_settings ADD COLUMN IF NOT EXISTS cron_token TEXT;

UPDATE public.report_settings SET cron_token = encode(gen_random_bytes(24), 'hex') WHERE cron_token IS NULL;

INSERT INTO public.report_settings (id, cron_token)
SELECT '00000000-0000-0000-0000-000000000000', encode(gen_random_bytes(24), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.report_settings);

CREATE OR REPLACE FUNCTION public.trigger_daily_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_enabled BOOLEAN;
BEGIN
  SELECT cron_token, COALESCE(enabled, true) INTO v_token, v_enabled
  FROM public.report_settings LIMIT 1;

  IF v_token IS NULL OR v_enabled IS FALSE THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://skewer-success-engine.lovable.app/api/public/daily-financial-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_daily_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_daily_report() TO service_role;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily_financial_report');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM cron.schedule(
    'daily_financial_report',
    '0 11 * * *',
    'SELECT public.trigger_daily_report()'
  );
END;
$$;
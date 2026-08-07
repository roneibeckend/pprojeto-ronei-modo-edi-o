CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to sync cron job with report_settings
CREATE OR REPLACE FUNCTION public.sync_report_cron()
RETURNS TRIGGER AS $$
DECLARE
    cron_time TEXT;
BEGIN
    -- Only sync if enabled
    IF NEW.enabled = true THEN
        -- Convert send_time (HH:MM) to cron format (MM HH * * *)
        -- Note: This assumes the database is already in the target timezone or you handle UTC conversion
        -- For simplicity in this implementation, we map HH:MM to 'MM HH * * *'
        cron_time := split_part(NEW.send_time, ':', 2) || ' ' || split_part(NEW.send_time, ':', 1) || ' * * *';
        
        -- Schedule the job
        -- We call the internal server route
        PERFORM cron.schedule(
            'daily_financial_report',
            cron_time,
            'SELECT net.http_post(
                url := ''https://' || current_setting('request.header.host', true) || '/api/public/daily-financial-report'',
                headers := jsonb_build_object(''Content-Type'', ''application/json''),
                body := ''{}''::jsonb
            )'
        );
    ELSE
        -- Unschedule if disabled
        PERFORM cron.unschedule('daily_financial_report');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-sync cron when settings change
DROP TRIGGER IF EXISTS on_report_settings_update ON public.report_settings;
CREATE TRIGGER on_report_settings_update
AFTER UPDATE ON public.report_settings
FOR EACH ROW EXECUTE FUNCTION public.sync_report_cron();

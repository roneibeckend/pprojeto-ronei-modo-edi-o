-- Allow NULL phone_e164 in report_recipients
ALTER TABLE public.report_recipients ALTER COLUMN phone_e164 DROP NOT NULL;

-- Ensure grants are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_recipients TO authenticated;
GRANT ALL ON public.report_recipients TO service_role;
GRANT SELECT, UPDATE ON public.report_settings TO authenticated;
GRANT ALL ON public.report_settings TO service_role;
GRANT SELECT, INSERT ON public.report_logs TO authenticated;
GRANT ALL ON public.report_logs TO service_role;

-- Fix sync_report_cron function with error handling for unschedule
CREATE OR REPLACE FUNCTION public.sync_report_cron()
RETURNS TRIGGER AS $$
DECLARE
    cron_time TEXT;
    project_url TEXT;
BEGIN
    project_url := 'https://espetinhonaveia.lovable.app/api/public/daily-financial-report';
    
    -- Unschedule existing if it exists, ignore if not found
    BEGIN
        PERFORM cron.unschedule('daily_financial_report');
    EXCEPTION WHEN OTHERS THEN
        -- Do nothing if job doesn't exist
    END;
    
    IF NEW.enabled = true THEN
        cron_time := split_part(NEW.send_time, ':', 2) || ' ' || split_part(NEW.send_time, ':', 1) || ' * * *';
        
        PERFORM cron.schedule(
            'daily_financial_report',
            cron_time,
            format('SELECT net.http_post(
                url := %L,
                headers := jsonb_build_object(
                    ''Content-Type'', ''application/json'',
                    ''Authorization'', ''Bearer '' || current_setting(''app.report_internal_secret'', true)
                ),
                body := ''{}''::jsonb
            )', project_url)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-trigger a sync for existing settings
UPDATE public.report_settings SET updated_at = now() WHERE id = '00000000-0000-0000-0000-000000000000';
-- 1. Add cover_url to live_classes
ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Function to update expired live class status
CREATE OR REPLACE FUNCTION public.update_expired_live_classes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update classes that are scheduled but their time has passed (+ 2 hours of buffer for live duration)
    UPDATE public.live_classes
    SET status = 'completed'
    WHERE status IN ('scheduled', 'live')
      AND scheduled_at < NOW() - INTERVAL '4 hours';
END;
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION public.update_expired_live_classes() TO service_role;

-- 4. Create cron job to run every hour
DO $$
BEGIN
    -- Try to unschedule if exists
    BEGIN
        PERFORM cron.unschedule('update_live_classes_status');
    EXCEPTION WHEN OTHERS THEN
        -- Do nothing
    END;
    
    PERFORM cron.schedule(
        'update_live_classes_status',
        '0 * * * *', -- Every hour at minute 0
        'SELECT public.update_expired_live_classes()'
    );
END;
$$;

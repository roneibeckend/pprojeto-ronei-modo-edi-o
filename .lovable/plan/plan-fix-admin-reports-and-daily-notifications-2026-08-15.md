# Plan: Fix Admin Reports and Daily Notifications

Investigate and resolve multiple errors in the reports module (`/admin/relatorios`), including authentication issues, database constraint violations, and cron job misconfigurations.

## Proposed Changes

### 1. Database Schema and Security
- **Fix `report_recipients` null constraint**: Alter `phone_e164` column to be nullable since the system has moved to email-based reports.
- **Grant Permissions**: Ensure `authenticated` and `service_role` have proper grants on `report_recipients`, `report_settings`, and `report_logs`.
- **Secret Management**: Generate a secure `REPORT_INTERNAL_SECRET` to authorize internal API calls between Supabase Cron and the app's server routes.

### 2. Backend Logic (Server Routes)
- **Fix "Unauthorized" Errors**:
    - Update `src/routes/api/public/daily-financial-report.ts` to verify the internal secret correctly.
    - Ensure the preview functionality works by allowing administrative access (via user session) OR the internal secret.
- **Fix Cron Job Sync**:
    - Update the `sync_report_cron` database function to properly handle the host and authorization header, preventing "command can not be NULL" or "could not find valid entry" errors during schedule updates.
    - Use a robust way to get the project URL for cron calls.

### 3. Frontend Fixes (`src/routes/admin.relatorios.tsx`)
- **Fix Preview Authentication**: Pass the current session token or use a specific server function to bypass the 401 error during manual preview/test calls from the UI.
- **Update Recipient Form**: Allow saving recipients without a phone number.

### 4. Cron Job Reliability
- Manually trigger a sync of the cron job once the internal secret is in place.

## Technical Details

### SQL Migration
```sql
-- Allow NULL phone_e164 in report_recipients
ALTER TABLE public.report_recipients ALTER COLUMN phone_e164 DROP NOT NULL;

-- Fix sync_report_cron function to include Authorization header
-- and handle host better
CREATE OR REPLACE FUNCTION public.sync_report_cron()
RETURNS TRIGGER AS $$
DECLARE
    cron_time TEXT;
    report_secret TEXT;
    project_url TEXT;
BEGIN
    -- We need the secret for the Bearer token
    -- In Lovable Cloud, we might need to store this in a specific config table 
    -- if we can't read environment variables directly in SQL easily.
    -- Better: The server function itself should handle the auth if called internally.
    
    IF NEW.enabled = true THEN
        cron_time := split_part(NEW.send_time, ':', 2) || ' ' || split_part(NEW.send_time, ':', 1) || ' * * *';
        
        -- Try to get host from settings or default to espetinhonaveia.lovable.app
        project_url := 'https://espetinhonaveia.lovable.app/api/public/daily-financial-report';

        -- Use a fixed internal secret set via environment variable
        PERFORM cron.schedule(
            'daily_financial_report',
            cron_time,
            format('SELECT net.http_post(url := %L, headers := %L, body := %L)',
                project_url,
                jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.report_internal_secret', true)
                ),
                '{}'::jsonb
            )
        );
    ELSE
        PERFORM cron.unschedule('daily_financial_report');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Environment Variables
- `REPORT_INTERNAL_SECRET`: A generated alphanumeric token.

## Verification Plan

### Automated Tests
- Run a manual POST to `/api/public/daily-financial-report` with the secret to verify it triggers.
- Check database logs for cron execution status.

### Manual Verification
1. Access `/admin/relatorios`.
2. Update the report time (should not throw "command can not be NULL").
3. Click "Pré-visualizar" (should not throw 401).
4. Add a recipient with only name and email (should not throw not-null violation).
5. Trigger a test send (should succeed).

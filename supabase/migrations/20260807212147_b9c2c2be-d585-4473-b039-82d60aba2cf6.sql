ALTER TABLE public.report_recipients ADD COLUMN IF NOT EXISTS email text;

-- Add a column to track delivery preference
ALTER TABLE public.report_settings ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'email';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_recipients TO authenticated;
GRANT ALL ON public.report_recipients TO service_role;

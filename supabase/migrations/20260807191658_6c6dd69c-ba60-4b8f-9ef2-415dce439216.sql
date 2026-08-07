-- Create report_recipients table
CREATE TABLE IF NOT EXISTS public.report_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_e164 TEXT NOT NULL CHECK (phone_e164 ~ '^\+?[1-9]\d{1,14}$'),
    active BOOLEAN NOT NULL DEFAULT true,
    report_types TEXT[] NOT NULL DEFAULT '{financial}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create report_settings table
CREATE TABLE IF NOT EXISTS public.report_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    send_time TEXT NOT NULL DEFAULT '08:00',
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    enabled BOOLEAN NOT NULL DEFAULT false,
    send_when_no_activity BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT singleton_check CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Insert default settings
INSERT INTO public.report_settings (id, send_time, timezone, enabled, send_when_no_activity)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '08:00', 'America/Sao_Paulo', false, false)
ON CONFLICT (id) DO NOTHING;

-- Create report_logs table
CREATE TABLE IF NOT EXISTS public.report_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.report_recipients(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
    provider_message_id TEXT,
    error TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_recipients TO authenticated;
GRANT ALL ON public.report_recipients TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.report_settings TO authenticated;
GRANT ALL ON public.report_settings TO service_role;

GRANT SELECT, INSERT ON public.report_logs TO authenticated;
GRANT ALL ON public.report_logs TO service_role;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage report recipients') THEN
        CREATE POLICY "Admins can manage report recipients" ON public.report_recipients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage report settings') THEN
        CREATE POLICY "Admins can manage report settings" ON public.report_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view report logs') THEN
        CREATE POLICY "Admins can view report logs" ON public.report_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
    END IF;
END $$;

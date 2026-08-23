CREATE TABLE public.system_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'fix',
  impact TEXT NOT NULL DEFAULT 'normal',
  released_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_updates TO authenticated;
GRANT ALL ON public.system_updates TO service_role;

ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam atualizações"
ON public.system_updates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_system_updates_updated_at
BEFORE UPDATE ON public.system_updates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX system_updates_released_at_idx ON public.system_updates (released_at DESC);

CREATE TABLE public.update_report_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.report_recipients(id) ON DELETE CASCADE,
  recipient_email TEXT,
  report_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  provider_message_id TEXT,
  error TEXT,
  updates_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.update_report_logs TO authenticated;
GRANT ALL ON public.update_report_logs TO service_role;

ALTER TABLE public.update_report_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins visualizam envios de atualizações"
ON public.update_report_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX update_report_logs_unique_sent_idx
ON public.update_report_logs (recipient_id, report_date)
WHERE status = 'sent';
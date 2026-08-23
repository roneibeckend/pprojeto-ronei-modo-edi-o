CREATE TABLE public.content_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('ebook','course')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX content_notifications_unique_idx ON public.content_notifications (content_type, content_id);

GRANT SELECT ON public.content_notifications TO authenticated;
GRANT ALL ON public.content_notifications TO service_role;

ALTER TABLE public.content_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content notifications"
ON public.content_notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
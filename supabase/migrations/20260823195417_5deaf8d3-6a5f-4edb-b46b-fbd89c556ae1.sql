DELETE FROM public.email_settings
WHERE id <> (SELECT id FROM public.email_settings ORDER BY created_at DESC LIMIT 1);

CREATE UNIQUE INDEX IF NOT EXISTS email_settings_singleton_idx
ON public.email_settings ((true));
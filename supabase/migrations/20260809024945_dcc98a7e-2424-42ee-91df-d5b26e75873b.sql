ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS opening_video_url TEXT;
GRANT SELECT ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;

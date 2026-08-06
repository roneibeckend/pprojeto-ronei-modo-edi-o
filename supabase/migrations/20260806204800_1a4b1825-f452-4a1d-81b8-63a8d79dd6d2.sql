ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;
GRANT SELECT ON public.ebooks TO anon;
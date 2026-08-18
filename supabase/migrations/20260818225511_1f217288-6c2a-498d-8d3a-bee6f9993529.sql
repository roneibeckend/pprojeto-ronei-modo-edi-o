-- 1. Alter content_certificates.content_id
ALTER TABLE public.content_certificates 
  DROP CONSTRAINT IF EXISTS content_certificates_content_id_key;

ALTER TABLE public.content_certificates 
  ALTER COLUMN content_id TYPE text USING content_id::text;

ALTER TABLE public.content_certificates 
  ADD CONSTRAINT content_certificates_content_id_key UNIQUE (content_id);

-- 2. Alter certificates.content_id
ALTER TABLE public.certificates 
  ALTER COLUMN content_id TYPE text USING content_id::text;

-- Grant permissions again for robustness
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_certificates TO authenticated;
GRANT ALL ON public.content_certificates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

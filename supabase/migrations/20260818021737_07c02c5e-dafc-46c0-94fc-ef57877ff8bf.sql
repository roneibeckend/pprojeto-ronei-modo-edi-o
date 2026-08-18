ALTER TABLE public.content_certificates ADD COLUMN IF NOT EXISTS city_of_issue TEXT DEFAULT 'Goiânia - Goiás';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS city_of_issue TEXT;

-- Update existing records if any
UPDATE public.content_certificates SET city_of_issue = 'Goiânia - Goiás' WHERE city_of_issue IS NULL;

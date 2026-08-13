-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-assets', 'ebook-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Grant usage on storage schema to authenticated role
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO authenticated;

-- Policies for ebook-assets
DO $$ 
BEGIN
    -- Drop existing policies if any to ensure a clean state
    DROP POLICY IF EXISTS "Admins can upload to ebook-assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update ebook-assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete from ebook-assets" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read from ebook-assets" ON storage.objects;
END $$;

CREATE POLICY "Admins can upload to ebook-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebook-assets' AND 
  (public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can update ebook-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ebook-assets' AND 
  (public.has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  bucket_id = 'ebook-assets' AND 
  (public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete from ebook-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ebook-assets' AND 
  (public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can read from ebook-assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ebook-assets');

-- Ensure course-assets is also fully covered
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', false)
ON CONFLICT (id) DO NOTHING;

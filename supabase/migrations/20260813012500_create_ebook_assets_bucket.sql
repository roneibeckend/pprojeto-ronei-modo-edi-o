-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-assets', 'ebook-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for ebook-assets
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

-- Ensure course-assets is also fully covered as a fallback/primary for other areas
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', false)
ON CONFLICT (id) DO NOTHING;

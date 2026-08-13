
-- Policy to allow admins to upload to 'course-assets'
CREATE POLICY "Admins can upload to course-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-assets' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Policy to allow admins to update their own uploads in 'course-assets'
CREATE POLICY "Admins can update course-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-assets' AND 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'course-assets' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Policy to allow admins to delete from 'course-assets'
CREATE POLICY "Admins can delete from course-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-assets' AND 
  public.has_role(auth.uid(), 'admin')
);

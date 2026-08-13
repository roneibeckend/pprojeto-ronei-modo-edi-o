
-- 1. Ensure SELECT permissions on storage.objects for authenticated users (required for signed URLs to work reliably)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can read objects'
    ) THEN
        CREATE POLICY "Authenticated users can read objects"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'course-assets');
    END IF;
END $$;

-- 2. Verify that authenticated role has usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

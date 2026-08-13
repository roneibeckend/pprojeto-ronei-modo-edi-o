-- Update bucket to be public
UPDATE storage.buckets SET public = true WHERE id = 'platform-materials';

-- Ensure policies exist for public read if needed, or at least authenticated read.
-- If the URL is public, we need a SELECT policy for 'anon' or just make the bucket public.
-- Making the bucket public in storage.buckets makes all objects public if they don't have RLS restrictions.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access to platform-materials'
    ) THEN
        CREATE POLICY "Public Access to platform-materials" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'platform-materials');
    END IF;
END $$;

-- Also ensure authenticated users can read (standard policy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Access to platform-materials'
    ) THEN
        CREATE POLICY "Authenticated Access to platform-materials" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'platform-materials');
    END IF;
END $$;

-- Ensure admins can manage objects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Admins manage platform-materials'
    ) THEN
        CREATE POLICY "Admins manage platform-materials" ON storage.objects
        FOR ALL TO authenticated
        USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'))
        WITH CHECK (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

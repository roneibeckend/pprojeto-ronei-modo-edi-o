-- Ensure policies exist for authenticated read on the private bucket
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Access to platform-materials') THEN
        DROP POLICY "Authenticated Access to platform-materials" ON storage.objects;
    END IF;

    CREATE POLICY "Authenticated Access to platform-materials" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'platform-materials');
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admins manage platform-materials') THEN
        DROP POLICY "Admins manage platform-materials" ON storage.objects;
    END IF;

    CREATE POLICY "Admins manage platform-materials" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'))
    WITH CHECK (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));
END $$;

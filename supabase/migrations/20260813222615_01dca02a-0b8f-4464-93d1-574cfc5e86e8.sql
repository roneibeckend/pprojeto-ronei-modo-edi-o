-- Garantir que as políticas de RLS para o bucket 'platform-materials' estejam corretas para acesso privado via URLs assinadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Access to platform-materials') THEN
        DROP POLICY "Authenticated Access to platform-materials" ON storage.objects;
    END IF;

    CREATE POLICY "Authenticated Access to platform-materials" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'platform-materials');
END $$;

-- Garantir políticas para ebook-assets e course-assets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Access to ebook-assets') THEN
        CREATE POLICY "Authenticated Access to ebook-assets" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'ebook-assets');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admins manage ebook-assets') THEN
        CREATE POLICY "Admins manage ebook-assets" ON storage.objects
        FOR ALL TO authenticated
        USING (bucket_id = 'ebook-assets' AND public.has_role(auth.uid(), 'admin'))
        WITH CHECK (bucket_id = 'ebook-assets' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Policies for storage
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'recipe-videos');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recipe-videos' AND (public.has_role(auth.uid(), 'admin')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE TO authenticated WITH CHECK (bucket_id = 'recipe-videos' AND (public.has_role(auth.uid(), 'admin')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recipe-videos' AND (public.has_role(auth.uid(), 'admin')));
    END IF;
END $$;

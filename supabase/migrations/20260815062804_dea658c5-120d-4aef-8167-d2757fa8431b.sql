-- Storage Policies for 'profiles' bucket
-- Allow public read access to profiles (avatars)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects
          FOR SELECT
          USING (bucket_id = 'profiles');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'User can upload avatar'
    ) THEN
        CREATE POLICY "User can upload avatar" ON storage.objects
          FOR INSERT
          WITH CHECK (
            bucket_id = 'profiles' AND 
            (storage.foldername(name))[1] = auth.uid()::text
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'User can update avatar'
    ) THEN
        CREATE POLICY "User can update avatar" ON storage.objects
          FOR UPDATE
          USING (
            bucket_id = 'profiles' AND 
            (storage.foldername(name))[1] = auth.uid()::text
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'User can delete avatar'
    ) THEN
        CREATE POLICY "User can delete avatar" ON storage.objects
          FOR DELETE
          USING (
            bucket_id = 'profiles' AND 
            (storage.foldername(name))[1] = auth.uid()::text
          );
    END IF;
END $$;

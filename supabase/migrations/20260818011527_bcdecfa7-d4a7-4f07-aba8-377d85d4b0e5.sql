DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Authenticated read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profiles');

DROP FUNCTION IF EXISTS public.test_duplicate_lesson_completion(uuid, uuid);
DROP FUNCTION IF EXISTS public.test_adversarial_concurrency(uuid, uuid);
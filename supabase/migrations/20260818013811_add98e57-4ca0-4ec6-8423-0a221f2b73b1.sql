-- 1. Revogar execução pública/anônima da função privilegiada de logs
REVOKE ALL ON FUNCTION public.log_system_event(text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_system_event(text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_system_event(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_system_event(text, text, text, jsonb) TO service_role;

-- 2. Restringir leitura de avatares à própria pasta do usuário
DROP POLICY IF EXISTS "Authenticated read avatars" ON storage.objects;

CREATE POLICY "Users can read their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
-- Políticas de RLS para o bucket de materiais (privado por padrão, acessível via RLS)
DO $$ 
BEGIN
    -- Política de leitura para usuários autenticados
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Read Access Materials') THEN
        CREATE POLICY "Authenticated Read Access Materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'platform-materials');
    END IF;

    -- Políticas de escrita para administradores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Insert Materials') THEN
        CREATE POLICY "Admin Insert Materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Update Materials') THEN
        CREATE POLICY "Admin Update Materials" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Delete Materials') THEN
        CREATE POLICY "Admin Delete Materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

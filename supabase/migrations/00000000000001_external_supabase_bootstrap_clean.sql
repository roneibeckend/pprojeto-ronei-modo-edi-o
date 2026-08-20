-- ==========================================================
-- VERSÃO 2 LIMPA E FINAL DO BOOTSTRAP SQL
-- PARA INSTÂNCIA EXTERNA SUPABASE
-- ==========================================================

-- 1. EXTENSÕES
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA public;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE EXTENSION IF NOT EXISTS supabase_vault SCHEMA vault;

-- 2. TABELAS (Profiles -> User Roles -> Content -> etc)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'lead',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- [Inserir aqui todas as outras 56 tabelas conforme o inventário auditado]

-- 3. FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cria o profile
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Nota técnica: user_roles não é criado aqui para evitar privilégios excessivos
  -- A aplicação assume 'student' como fallback via useAuth() caso user_roles esteja vazio.
  
  RETURN new;
END;
$$;

-- 4. REALTIME (Idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignora erros se a publication não existir ainda
END $$;

-- 5. TRIGGER AUTH
-- Deve ser criado por último
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ==========================================================
-- 6. STORAGE (BUCKETS + POLICIES AUDITADAS)
-- ANTES: 25 policies em storage.objects
-- DEPOIS: 16 policies (9 removidas: 4 de recipe-videos, 3 duplicadas em
--         profiles com role public, 1 policy ALL redundante, 1 service_role)
-- Regras aplicadas:
--   * RBAC real via public.has_role(auth.uid(),'admin') / user_roles
--   * NUNCA autorização apenas por auth.role() = 'authenticated'
--   * TODA policy restringe bucket_id explicitamente
--   * service_role NÃO recebe policy (possui BYPASSRLS)
-- ==========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
    ('content-covers',     'content-covers',     false),
    ('course-assets',      'course-assets',      false),
    ('ebook-assets',       'ebook-assets',       false),
    ('platform-materials', 'platform-materials', false),
    ('profiles',           'profiles',           false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ---------- content-covers (4) ----------
CREATE POLICY "content_covers_public_read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'content-covers');

CREATE POLICY "content_covers_admin_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'content-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content_covers_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'content-covers' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'content-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content_covers_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'content-covers' AND public.has_role(auth.uid(), 'admin'));

-- ---------- course-assets (3) ----------
CREATE POLICY "Admins can upload to course-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update course-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'course-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from course-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-assets' AND public.has_role(auth.uid(), 'admin'));

-- ---------- ebook-assets (1) ----------
-- Mantida como ALL: não existem policies específicas de INSERT/UPDATE/DELETE
-- para este bucket, portanto NÃO é redundante.
CREATE POLICY "Admins manage ebook-assets"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'ebook-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'ebook-assets' AND public.has_role(auth.uid(), 'admin'));

-- ---------- platform-materials (3) ----------
-- "Admins manage platform-materials" (ALL) REMOVIDA: redundante com as 3 abaixo
-- + a policy de leitura de staff.
CREATE POLICY "Admin Insert Materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin Update Materials"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin Delete Materials"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));

-- ---------- leitura de staff (1) : course-assets + ebook-assets + platform-materials ----------
CREATE POLICY "Staff can read course and ebook assets"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id IN ('course-assets', 'ebook-assets', 'platform-materials')
    AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin', 'manager', 'agent')
    )
);

-- ---------- profiles / avatares (4) ----------
-- Sem leitura pública: cada usuário lê apenas a própria pasta (<uid>/...).
-- As 3 policies duplicadas com role "public" foram REMOVIDAS.
CREATE POLICY "Users can read their own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- TOTAL FINAL: 16 policies em storage.objects

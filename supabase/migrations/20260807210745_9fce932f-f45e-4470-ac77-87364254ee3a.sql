-- 1. Verificar e adicionar coluna video_url se necessário (embora o schema diga que já existe, garantimos na migração)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ebook_chapters' AND column_name='video_url') THEN
        ALTER TABLE public.ebook_chapters ADD COLUMN video_url TEXT;
    END IF;
END $$;

-- 2. Garantir permissões básicas
GRANT ALL ON public.ebook_modules TO authenticated;
GRANT ALL ON public.ebook_modules TO service_role;
GRANT ALL ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;

-- 3. Habilitar RLS (caso não esteja)
ALTER TABLE public.ebook_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Administradores, Gerentes e Agentes (Gestão Total)
DROP POLICY IF EXISTS "Admins can manage ebook modules" ON public.ebook_modules;
CREATE POLICY "Admins can manage ebook modules"
ON public.ebook_modules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Admins can manage ebook chapters" ON public.ebook_chapters;
CREATE POLICY "Admins can manage ebook chapters"
ON public.ebook_chapters
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
);

-- 5. Políticas de Visualização para Alunos (Leitura)
DROP POLICY IF EXISTS "Users can view modules of enrolled ebooks" ON public.ebook_modules;
CREATE POLICY "Users can view modules of enrolled ebooks"
ON public.ebook_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ebook_enrollments e
    WHERE e.ebook_id = ebook_modules.ebook_id
    AND e.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Users can view chapters of enrolled ebooks" ON public.ebook_chapters;
CREATE POLICY "Users can view chapters of enrolled ebooks"
ON public.ebook_chapters
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ebook_enrollments e
    WHERE e.ebook_id = ebook_chapters.ebook_id
    AND e.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
);

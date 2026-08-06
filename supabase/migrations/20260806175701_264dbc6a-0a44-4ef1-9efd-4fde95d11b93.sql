
-- Criação do enum para status de aulas ao vivo
DO $$ BEGIN
    CREATE TYPE public.live_class_status AS ENUM ('scheduled', 'live', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de Aulas ao Vivo
CREATE TABLE IF NOT EXISTS public.live_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    link TEXT,
    materials_url TEXT,
    status public.live_class_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionando colunas de controle na tabela courses se não existirem
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS content_url TEXT;

-- Tabela de Ebooks se não existir
CREATE TABLE IF NOT EXISTS public.ebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    cover TEXT,
    price DECIMAL(10,2),
    is_ai_generated BOOLEAN DEFAULT false,
    content_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_classes TO authenticated;
GRANT ALL ON public.live_classes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;

-- RLS
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- Políticas para Admins (usando a função has_role existente)
CREATE POLICY "Admins can manage live_classes" ON public.live_classes
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage ebooks" ON public.ebooks
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Políticas de leitura para usuários autenticados
CREATE POLICY "Users can view live_classes" ON public.live_classes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view courses" ON public.courses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view ebooks" ON public.ebooks
    FOR SELECT TO authenticated USING (true);

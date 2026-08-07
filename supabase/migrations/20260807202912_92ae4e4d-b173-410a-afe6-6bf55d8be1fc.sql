
-- Restoration of Ebook Functionality

-- 1. Ebooks Table
CREATE TABLE IF NOT EXISTS public.ebooks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    cover TEXT,
    cover_url TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    original_price DECIMAL(10,2) DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    content_url TEXT,
    video_url TEXT,
    pages_count INT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ebook Modules
CREATE TABLE IF NOT EXISTS public.ebook_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebook_id TEXT NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ebook Chapters
CREATE TABLE IF NOT EXISTS public.ebook_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebook_id TEXT NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.ebook_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT,
    content TEXT,
    video_url TEXT,
    order_index INT NOT NULL DEFAULT 0,
    reading_minutes INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ebook Enrollments
CREATE TABLE IF NOT EXISTS public.ebook_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ebook_id TEXT REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, ebook_id)
);

-- 5. Ebook Progress
CREATE TABLE IF NOT EXISTS public.ebook_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.ebook_chapters(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, chapter_id)
);

-- Permissions
GRANT ALL ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;
GRANT ALL ON public.ebook_modules TO authenticated;
GRANT ALL ON public.ebook_modules TO service_role;
GRANT ALL ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;
GRANT ALL ON public.ebook_enrollments TO authenticated;
GRANT ALL ON public.ebook_enrollments TO service_role;
GRANT ALL ON public.ebook_progress TO authenticated;
GRANT ALL ON public.ebook_progress TO service_role;

-- RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view ebooks" ON public.ebooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ebooks" ON public.ebooks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view modules" ON public.ebook_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage modules" ON public.ebook_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view chapters" ON public.ebook_chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage chapters" ON public.ebook_chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own enrollments" ON public.ebook_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage enrollments" ON public.ebook_enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own progress" ON public.ebook_progress FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Seed Data
INSERT INTO public.ebooks (id, title, description, cover_url, pages_count, category, price, is_locked)
VALUES
('guia-completo', 'Guia Completo do Espetinho Lucrativo', 'O passo a passo do zero aos 10k por mês.', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a', 84, 'Negócio', 0, false),
('50-receitas', '50 Receitas de Espetinhos', 'Variedade que fideliza clientes.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 62, 'Receitas', 0, false);

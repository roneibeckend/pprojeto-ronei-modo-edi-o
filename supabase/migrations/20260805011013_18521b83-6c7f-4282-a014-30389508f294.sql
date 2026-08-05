-- 1. Enums (Idempotent approach using DO block)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE public.difficulty_level AS ENUM ('Fácil', 'Médio', 'Avançado');
    END IF;
END $$;

-- 2. Tables

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    teacher_name TEXT,
    price DECIMAL(10,2),
    is_locked BOOLEAN DEFAULT false,
    badge TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Modules
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT,
    video_url TEXT,
    is_locked BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ebooks
CREATE TABLE IF NOT EXISTS public.ebooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    pages_count INT,
    category TEXT,
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    image_url TEXT,
    ingredients TEXT[],
    yield TEXT,
    prep_time TEXT,
    difficulty public.difficulty_level DEFAULT 'Fácil',
    steps TEXT[],
    cost TEXT,
    sell_price TEXT,
    profit_margin TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    last_position_seconds INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- Support
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 4. Grants
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT ON public.ebooks TO authenticated;
GRANT SELECT ON public.recipes TO authenticated;
GRANT ALL ON public.lesson_progress TO authenticated;
GRANT ALL ON public.support_tickets TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 5. Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Courses are viewable by authenticated users') THEN
        CREATE POLICY "Courses are viewable by authenticated users" ON public.courses FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Modules are viewable by authenticated users') THEN
        CREATE POLICY "Modules are viewable by authenticated users" ON public.modules FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lessons are viewable by authenticated users') THEN
        CREATE POLICY "Lessons are viewable by authenticated users" ON public.lessons FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ebooks are viewable by authenticated users') THEN
        CREATE POLICY "Ebooks are viewable by authenticated users" ON public.ebooks FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recipes are viewable by authenticated users') THEN
        CREATE POLICY "Recipes are viewable by authenticated users" ON public.recipes FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own progress') THEN
        CREATE POLICY "Users can view their own progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own progress') THEN
        CREATE POLICY "Users can update their own progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their tickets') THEN
        CREATE POLICY "Users can manage their tickets" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;

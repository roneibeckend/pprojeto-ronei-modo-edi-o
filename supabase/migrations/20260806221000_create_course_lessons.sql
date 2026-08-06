-- Tabela de aulas do curso
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    content TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permissões
GRANT ALL ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
GRANT SELECT ON public.course_lessons TO anon;

-- RLS
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Política para administradores/gestores
CREATE POLICY "Admins can manage course lessons"
ON public.course_lessons
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

-- Política de leitura para alunos matriculados ou aulas gratuitas
CREATE POLICY "Users can view lessons of enrolled courses or free lessons"
ON public.course_lessons
FOR SELECT
TO authenticated
USING (
  is_free = true OR
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.course_enrollments e ON e.course_id = m.course_id
    WHERE m.id = course_lessons.module_id
    AND e.user_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order_index ON public.course_lessons(order_index);

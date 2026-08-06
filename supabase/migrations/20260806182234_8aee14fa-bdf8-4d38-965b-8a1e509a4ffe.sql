CREATE TABLE public.ebook_enrollments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ebook_id text REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, ebook_id)
);

-- Grant access to authenticated users and service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebook_enrollments TO authenticated;
GRANT ALL ON public.ebook_enrollments TO service_role;

-- Enable RLS
ALTER TABLE public.ebook_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for ebook_enrollments
CREATE POLICY "Users can view their own ebook enrollments" 
ON public.ebook_enrollments FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ebook enrollments" 
ON public.ebook_enrollments FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Ensure course_enrollments has proper RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Safely drop and recreate policies for course_enrollments
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own enrollments' AND tablename = 'course_enrollments') THEN
        DROP POLICY "Users can view their own enrollments" ON public.course_enrollments;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all enrollments' AND tablename = 'course_enrollments') THEN
        DROP POLICY "Admins can manage all enrollments" ON public.course_enrollments;
    END IF;
END $$;

CREATE POLICY "Users can view their own course enrollments" 
ON public.course_enrollments FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all course enrollments" 
ON public.course_enrollments FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

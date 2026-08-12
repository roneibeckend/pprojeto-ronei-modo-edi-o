CREATE TABLE public.course_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    video_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_feedback TO authenticated;
GRANT ALL ON public.course_feedback TO service_role;
GRANT SELECT ON public.course_feedback TO anon;

ALTER TABLE public.course_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
ON public.course_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view approved feedback"
ON public.course_feedback FOR SELECT
TO authenticated
USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
ON public.course_feedback FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Public can view approved feedback"
ON public.course_feedback FOR SELECT
TO anon
USING (status = 'approved');

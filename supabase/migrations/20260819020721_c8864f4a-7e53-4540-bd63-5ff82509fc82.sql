GRANT SELECT, INSERT, UPDATE, DELETE ON public.unhandled_questions TO authenticated;
GRANT ALL ON public.unhandled_questions TO service_role;
GRANT INSERT ON public.unhandled_questions TO anon;

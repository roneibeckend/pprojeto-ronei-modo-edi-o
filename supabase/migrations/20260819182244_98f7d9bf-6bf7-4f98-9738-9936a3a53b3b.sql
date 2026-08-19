DROP POLICY IF EXISTS "Users can insert feedback" ON public.knowledge_feedback;
CREATE POLICY "Users can insert own feedback"
ON public.knowledge_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND knowledge_id IS NOT NULL
);

DROP POLICY IF EXISTS "Users can insert unhandled" ON public.unhandled_questions;
CREATE POLICY "Users can insert own unhandled questions"
ON public.unhandled_questions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND question IS NOT NULL
  AND length(question) BETWEEN 1 AND 2000
  AND (context IS NULL OR length(context::text) <= 4000)
);

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR length(name) BETWEEN 1 AND 120)
  AND (phone IS NULL OR length(phone) BETWEEN 8 AND 25)
  AND (source IS NULL OR source IN ('landing','popup','checkout','chatbot','app','import'))
);
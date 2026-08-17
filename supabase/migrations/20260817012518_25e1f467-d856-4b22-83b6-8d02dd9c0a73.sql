-- Permitir que usuários anônimos leiam entradas ativas da base de conhecimento
GRANT SELECT ON public.knowledge_base TO anon;
GRANT INSERT ON public.unhandled_questions TO anon;
GRANT INSERT ON public.knowledge_feedback TO anon;

-- Atualizar políticas de RLS para permitir acesso anônimo
DROP POLICY IF EXISTS "Anyone can read active knowledge" ON public.knowledge_base;
CREATE POLICY "Anyone can read active knowledge"
ON public.knowledge_base FOR SELECT
TO anon, authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "Users can insert unhandled" ON public.unhandled_questions;
CREATE POLICY "Users can insert unhandled"
ON public.unhandled_questions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert feedback" ON public.knowledge_feedback;
CREATE POLICY "Users can insert feedback"
ON public.knowledge_feedback FOR INSERT
TO anon, authenticated
WITH CHECK (true);

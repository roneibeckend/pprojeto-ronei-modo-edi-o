
-- 1. Inserir cursos com as colunas corretas
INSERT INTO public.courses (id, title, description, cover_url, teacher_name, price, is_locked)
VALUES 
    ('espetinho-basico', 'Mestre do Espetinho', 'Curso fundamental para iniciantes.', 'https://images.unsplash.com/photo-1544025162-d76694265947', 'Chef Brasa', 0, false),
    ('espetinho-avancado', 'Gourmet Pro', 'Técnicas avançadas de churrasco.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 'Chef Brasa', 0, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir matrículas apenas com as colunas existentes (id será automático)
INSERT INTO public.course_enrollments (user_id, course_id)
SELECT u.id, c.id
FROM auth.users u
CROSS JOIN public.courses c
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 3. Auditoria de Progresso: Garantir RLS correta para progresso
-- Já verifiquei que RLS está true, mas vamos reforçar a política de exclusividade do usuário
DROP POLICY IF EXISTS "Users can update their own progress" ON public.lesson_progress;
CREATE POLICY "Users can update their own progress"
ON public.lesson_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Auditoria de Suporte: Garantir que a Brasa salve corretamente
-- Brasa (assistant) precisa salvar mensagens. Como o frontend usa o token do usuário,
-- e a política de inserção restringe sender_type = 'student', precisamos de uma função 
-- security definer para a Brasa ou permitir que o usuário insira mensagens da Brasa (menos seguro mas prático para mock)
-- ou usar uma Edge Function. O prompt pede que a resposta da Brasa seja salva.
-- Vou criar uma função security definer para o frontend chamar e salvar a resposta da Brasa.

CREATE OR REPLACE FUNCTION public.save_assistant_response(p_ticket_id UUID, p_content TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.support_messages (ticket_id, content, sender_type)
    VALUES (p_ticket_id, p_content, 'assistant');
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_assistant_response(UUID, TEXT) TO authenticated;

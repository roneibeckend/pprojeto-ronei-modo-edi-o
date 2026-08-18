
CREATE OR REPLACE FUNCTION public.test_duplicate_lesson_completion(p_enrollment_id UUID, p_lesson_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
BEGIN
    -- Tenta inserir duas vezes o mesmo progresso simultaneamente (emulando concorrência)
    -- Na prática, o RPC é atômico, então vamos testar a restrição de unicidade
    BEGIN
        INSERT INTO public.lesson_progress (enrollment_id, lesson_id, status)
        VALUES (p_enrollment_id, p_lesson_id, 'completed');
        
        INSERT INTO public.lesson_progress (enrollment_id, lesson_id, status)
        VALUES (p_enrollment_id, p_lesson_id, 'completed');
        
        RETURN QUERY SELECT FALSE, 'Falha: Permitiu duplicata';
    EXCEPTION WHEN unique_violation THEN
        RETURN QUERY SELECT TRUE, 'Sucesso: Constraint impediu duplicata';
    END;
END;
$$;

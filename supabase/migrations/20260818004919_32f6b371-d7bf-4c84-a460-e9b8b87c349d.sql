
DROP FUNCTION public.test_adversarial_concurrency(uuid,uuid);

CREATE OR REPLACE FUNCTION public.test_adversarial_concurrency(p_user_id UUID, p_lesson_id UUID)
RETURNS TABLE(scenario TEXT, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_course_id UUID;
BEGIN
    -- Cenário 1: Concluir aula duplicada
    BEGIN
        INSERT INTO public.lesson_progress (user_id, lesson_id, is_completed)
        VALUES (p_user_id, p_lesson_id, true);
        
        INSERT INTO public.lesson_progress (user_id, lesson_id, is_completed)
        VALUES (p_user_id, p_lesson_id, true);
        
        scenario := 'Duplicidade de Aula';
        success := FALSE;
        message := 'Falha: Permitiu inserir duas vezes o mesmo progresso.';
        RETURN NEXT;
    EXCEPTION WHEN unique_violation THEN
        scenario := 'Duplicidade de Aula';
        success := TRUE;
        message := 'Sucesso: Constraint de unicidade impediu duplicata.';
        RETURN NEXT;
    END;

    -- Cenário 2: Matrícula duplicada no mesmo curso
    BEGIN
        SELECT course_id INTO v_course_id FROM public.course_enrollments WHERE user_id = p_user_id LIMIT 1;
        
        IF v_course_id IS NOT NULL THEN
            INSERT INTO public.course_enrollments (user_id, course_id, status)
            VALUES (p_user_id, v_course_id, 'active');
            
            scenario := 'Matrícula Duplicada';
            success := FALSE;
            message := 'Falha: Permitiu matrícula duplicada para o mesmo curso.';
            RETURN NEXT;
        ELSE
            scenario := 'Matrícula Duplicada';
            success := TRUE;
            message := 'Nenhum curso encontrado para o usuário de teste.';
            RETURN NEXT;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        scenario := 'Matrícula Duplicada';
        success := TRUE;
        message := 'Sucesso: Constraint impediu re-matrícula ativa.';
        RETURN NEXT;
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_adversarial_concurrency TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_adversarial_concurrency TO service_role;
REVOKE EXECUTE ON FUNCTION public.test_adversarial_concurrency FROM public, anon;

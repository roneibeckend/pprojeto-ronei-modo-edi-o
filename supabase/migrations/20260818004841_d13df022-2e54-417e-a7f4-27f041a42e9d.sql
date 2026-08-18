
CREATE OR REPLACE FUNCTION public.test_adversarial_concurrency(p_enrollment_id UUID, p_lesson_id UUID)
RETURNS TABLE(scenario TEXT, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cenário 1: Concluir aula duplicada
    BEGIN
        INSERT INTO public.lesson_progress (course_enrollment_id, lesson_id, status)
        VALUES (p_enrollment_id, p_lesson_id, 'completed');
        
        INSERT INTO public.lesson_progress (course_enrollment_id, lesson_id, status)
        VALUES (p_enrollment_id, p_lesson_id, 'completed');
        
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
        -- Pegar o user_id da matrícula existente
        DECLARE
            v_user_id UUID;
            v_course_id UUID;
        BEGIN
            SELECT user_id, course_id INTO v_user_id, v_course_id FROM public.course_enrollments WHERE id = p_enrollment_id;
            
            INSERT INTO public.course_enrollments (user_id, course_id, status)
            VALUES (v_user_id, v_course_id, 'active');
            
            scenario := 'Matrícula Duplicada';
            success := FALSE;
            message := 'Falha: Permitiu matrícula duplicada para o mesmo curso.';
            RETURN NEXT;
        EXCEPTION WHEN unique_violation THEN
            scenario := 'Matrícula Duplicada';
            success := TRUE;
            message := 'Sucesso: Constraint impediu re-matrícula ativa.';
            RETURN NEXT;
        END;
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_adversarial_concurrency TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_adversarial_concurrency TO service_role;

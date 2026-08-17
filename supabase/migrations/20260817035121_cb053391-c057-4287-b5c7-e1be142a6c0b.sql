ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS course_id text REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.complete_linked_course(_ebook_id text, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_course_id text;
    v_lesson_record record;
BEGIN
    -- 1. Get linked course_id
    SELECT course_id INTO v_course_id FROM ebooks WHERE id = _ebook_id;
    
    IF v_course_id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Mark all lessons of this course as completed
    FOR v_lesson_record IN 
        SELECT l.id 
        FROM course_lessons l
        JOIN course_modules m ON l.module_id = m.id
        WHERE m.course_id = v_course_id
    LOOP
        INSERT INTO lesson_progress (user_id, lesson_id, is_completed, updated_at)
        VALUES (_user_id, v_lesson_record.id, true, now())
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET is_completed = true, updated_at = now();
    END LOOP;

    -- 3. Mark course as completed in progress_tracking
    INSERT INTO progress_tracking (user_id, item_type, item_id, started_at, completed_at)
    VALUES (_user_id, 'course', v_course_id, now(), now())
    ON CONFLICT (user_id, item_type, item_id)
    DO UPDATE SET completed_at = COALESCE(progress_tracking.completed_at, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_linked_course(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_linked_course(text, uuid) TO service_role;

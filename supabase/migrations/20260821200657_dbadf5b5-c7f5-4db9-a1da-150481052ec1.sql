CREATE OR REPLACE FUNCTION public.check_progress_milestones()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := NEW.user_id;
    v_item_id TEXT := NEW.item_id;
    v_item_type TEXT := NEW.item_type;
    v_current_percent INTEGER;
    v_last_milestone INTEGER := COALESCE(OLD.last_milestone, 0);
    v_item_title TEXT;
    v_total_items INTEGER := 0;
    v_completed_items INTEGER := 0;
    v_notification_id UUID;
    v_title TEXT;
    v_msg TEXT;
    v_new_milestone INTEGER;
BEGIN
    IF v_item_type = 'ebook' THEN
        SELECT count(*) INTO v_total_items FROM public.ebook_chapters WHERE ebook_id = v_item_id;
        SELECT count(*) INTO v_completed_items
        FROM public.ebook_progress
        WHERE user_id = v_user_id
          AND completed_at IS NOT NULL
          AND chapter_id IN (SELECT id FROM public.ebook_chapters WHERE ebook_id = v_item_id);
        SELECT title INTO v_item_title FROM public.ebooks WHERE id = v_item_id;
    ELSIF v_item_type = 'course' THEN
        SELECT count(*) INTO v_total_items
        FROM public.course_lessons
        WHERE module_id IN (SELECT id FROM public.course_modules WHERE course_id = v_item_id);
        SELECT count(*) INTO v_completed_items
        FROM public.lesson_progress
        WHERE user_id = v_user_id AND is_completed = true AND lesson_id IN (
            SELECT id FROM public.course_lessons WHERE module_id IN (SELECT id FROM public.course_modules WHERE course_id = v_item_id)
        );
        SELECT title INTO v_item_title FROM public.courses WHERE id = v_item_id;
    ELSE
        RETURN NEW;
    END IF;

    IF COALESCE(v_total_items, 0) > 0 THEN
        v_current_percent := (v_completed_items * 100) / v_total_items;
        v_item_title := COALESCE(v_item_title, 'Conteúdo');

        IF v_current_percent >= 100 AND v_last_milestone < 100 THEN
            v_new_milestone := 100; v_title := 'Conclusão Incrível!';
            v_msg := 'Parabéns! Você concluiu 100% do conteúdo: ' || v_item_title;
        ELSIF v_current_percent >= 75 AND v_last_milestone < 75 THEN
            v_new_milestone := 75; v_title := 'Quase lá!';
            v_msg := 'Você já completou 75% de ' || v_item_title || '. Continue assim!';
        ELSIF v_current_percent >= 50 AND v_last_milestone < 50 THEN
            v_new_milestone := 50; v_title := 'Metade do caminho!';
            v_msg := 'Você atingiu 50% de ' || v_item_title || '. Ótimo progresso!';
        ELSIF v_current_percent >= 25 AND v_last_milestone < 25 THEN
            v_new_milestone := 25; v_title := 'Bom começo!';
            v_msg := 'Você completou os primeiros 25% de ' || v_item_title;
        END IF;

        IF v_new_milestone IS NOT NULL THEN
            INSERT INTO public.notifications (title, message, type, target_type)
            VALUES (v_title, v_msg, 'general', 'segmented')
            RETURNING id INTO v_notification_id;
            INSERT INTO public.user_notifications (user_id, notification_id)
            VALUES (v_user_id, v_notification_id) ON CONFLICT DO NOTHING;
            NEW.last_milestone := v_new_milestone;
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION WHEN others THEN
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.finalize_ebook_completion(_ebook_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_now TIMESTAMPTZ := now();
  v_chapters INT := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  INSERT INTO public.ebook_progress (user_id, chapter_id, completed_at, last_read_at)
  SELECT v_user, c.id, v_now, v_now
  FROM public.ebook_chapters c
  WHERE c.ebook_id = _ebook_id
  ON CONFLICT (user_id, chapter_id)
  DO UPDATE SET completed_at = COALESCE(public.ebook_progress.completed_at, v_now), last_read_at = v_now;

  SELECT count(*) INTO v_chapters FROM public.ebook_chapters WHERE ebook_id = _ebook_id;

  INSERT INTO public.progress_tracking (user_id, item_type, item_id, started_at, completed_at)
  SELECT v_user, 'ebook_module', m.id::text, v_now, v_now
  FROM public.ebook_modules m WHERE m.ebook_id = _ebook_id
  ON CONFLICT (user_id, item_type, item_id)
  DO UPDATE SET completed_at = COALESCE(public.progress_tracking.completed_at, v_now);

  INSERT INTO public.progress_tracking (user_id, item_type, item_id, started_at, completed_at)
  VALUES (v_user, 'ebook', _ebook_id, v_now, v_now)
  ON CONFLICT (user_id, item_type, item_id)
  DO UPDATE SET completed_at = COALESCE(public.progress_tracking.completed_at, v_now);

  RETURN jsonb_build_object('success', true, 'chapters', v_chapters);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_ebook_completion(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_ebook_completion(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalize_ebook_completion(TEXT) TO authenticated;

INSERT INTO public.ebook_progress (user_id, chapter_id, completed_at, last_read_at)
SELECT 'ec84815b-72c1-469d-a642-acc1ee16473f', c.id, now(), now()
FROM public.ebook_chapters c
WHERE c.ebook_id = 'ee1a776c-6c7d-4a88-a980-7e671ad8d4fb'
ON CONFLICT (user_id, chapter_id) DO UPDATE SET completed_at = COALESCE(public.ebook_progress.completed_at, now());

UPDATE public.progress_tracking SET completed_at = now()
WHERE user_id = 'ec84815b-72c1-469d-a642-acc1ee16473f'
  AND item_type IN ('ebook','ebook_module')
  AND completed_at IS NULL;
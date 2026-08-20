--
-- PostgreSQL database dump
--



-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: affiliate_sale_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.affiliate_sale_status AS ENUM (
    'pending',
    'paid',
    'cancelled'
);


ALTER TYPE public.affiliate_sale_status OWNER TO postgres;

--
-- Name: affiliate_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.affiliate_status AS ENUM (
    'pending',
    'active',
    'blocked'
);


ALTER TYPE public.affiliate_status OWNER TO postgres;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'student',
    'manager',
    'agent'
);


ALTER TYPE public.app_role OWNER TO postgres;

--
-- Name: difficulty_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.difficulty_level AS ENUM (
    'Fácil',
    'Médio',
    'Avançado'
);


ALTER TYPE public.difficulty_level OWNER TO postgres;

--
-- Name: integration_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.integration_type AS ENUM (
    'ia',
    'payment'
);


ALTER TYPE public.integration_type OWNER TO postgres;

--
-- Name: knowledge_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.knowledge_category AS ENUM (
    'CONTA',
    'CURSOS',
    'EBOOKS',
    'MATERIAIS',
    'PWA',
    'SUPORTE',
    'PROBLEMAS'
);


ALTER TYPE public.knowledge_category OWNER TO postgres;

--
-- Name: live_class_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.live_class_status AS ENUM (
    'scheduled',
    'live',
    'completed'
);


ALTER TYPE public.live_class_status OWNER TO postgres;

--
-- Name: payout_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payout_status AS ENUM (
    'pending',
    'analyzing',
    'approved',
    'paid',
    'rejected'
);


ALTER TYPE public.payout_status OWNER TO postgres;

--
-- Name: support_sender_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.support_sender_type AS ENUM (
    'student',
    'assistant',
    'support_agent',
    'system'
);


ALTER TYPE public.support_sender_type OWNER TO postgres;

--
-- Name: support_ticket_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.support_ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE public.support_ticket_status OWNER TO postgres;

--
-- Name: acquire_asaas_webhook_claim(text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb) RETURNS TABLE(claim_token text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_token text;
BEGIN
    IF EXISTS (SELECT 1 FROM public.asaas_webhook_events WHERE event_id = p_event_id AND status = 'completed') THEN
        RETURN;
    END IF;

    v_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.asaas_webhook_events (event_id, payment_id, event_type, payload, claim_token, status)
    VALUES (p_event_id, p_payment_id, p_event_type, p_payload, v_token, 'processing')
    ON CONFLICT (event_id) DO UPDATE 
    SET claim_token = v_token,
        status = 'processing',
        created_at = now()
    WHERE asaas_webhook_events.status != 'completed';

    IF FOUND THEN
        RETURN QUERY SELECT v_token;
    END IF;
END;
$$;


ALTER FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb) OWNER TO postgres;

--
-- Name: acquire_asaas_webhook_claim(text, text, text, jsonb, interval); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb, p_lease_interval interval DEFAULT '00:05:00'::interval) RETURNS TABLE(claim_token uuid, status text, claimed_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_claim_token UUID := gen_random_uuid();
    v_now TIMESTAMPTZ := now();
BEGIN
    -- Try to insert a new event record
    INSERT INTO public.asaas_webhook_events (
        event_id,
        payment_id,
        event_type,
        status,
        claim_token,
        claimed_at,
        payload
    )
    VALUES (
        p_event_id,
        p_payment_id,
        p_event_type,
        'processing',
        v_claim_token,
        v_now,
        p_payload
    )
    ON CONFLICT (event_id) DO UPDATE
    SET
        status = 'processing',
        claim_token = v_claim_token,
        claimed_at = v_now,
        last_error = NULL
    WHERE
        -- Only reclaim if failed or lease expired
        asaas_webhook_events.status = 'failed'
        OR (
            asaas_webhook_events.status = 'processing'
            AND asaas_webhook_events.claimed_at < v_now - p_lease_interval
        )
    -- This condition ensures only ONE request wins the race
    RETURNING 
        asaas_webhook_events.claim_token, 
        asaas_webhook_events.status, 
        asaas_webhook_events.claimed_at
    INTO claim_token, status, claimed_at;

    -- If no row was returned (conflict not meeting WHERE condition), return TABLE values
    RETURN NEXT;
END;
$$;


ALTER FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb, p_lease_interval interval) OWNER TO postgres;

--
-- Name: affiliate_sensitive_fields_unchanged(uuid, public.affiliate_status, numeric, numeric, numeric, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.affiliate_sensitive_fields_unchanged(_id uuid, _status public.affiliate_status, _commission_rate numeric, _balance numeric, _total_earnings numeric, _referrer_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = _id
      AND a.status = _status
      AND a.commission_rate = _commission_rate
      AND a.balance = _balance
      AND a.total_earnings = _total_earnings
      AND a.referrer_id IS NOT DISTINCT FROM _referrer_id
  )
$$;


ALTER FUNCTION public.affiliate_sensitive_fields_unchanged(_id uuid, _status public.affiliate_status, _commission_rate numeric, _balance numeric, _total_earnings numeric, _referrer_id uuid) OWNER TO postgres;

--
-- Name: award_points(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.award_points(p_user_id uuid, p_points integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.user_stats (user_id, total_points)
    VALUES (p_user_id, p_points)
    ON CONFLICT (user_id) DO UPDATE
    SET total_points = public.user_stats.total_points + p_points;
END;
$$;


ALTER FUNCTION public.award_points(p_user_id uuid, p_points integer) OWNER TO postgres;

--
-- Name: check_progress_milestones(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_progress_milestones() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_item_id UUID;
    v_item_type TEXT;
    v_current_percent INTEGER;
    v_last_milestone INTEGER;
    v_item_title TEXT;
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_notification_id UUID;
BEGIN
    v_user_id := NEW.user_id;
    v_item_id := NEW.item_id;
    v_item_type := NEW.item_type;
    v_last_milestone := COALESCE(OLD.last_milestone, 0);

    -- Calcula a porcentagem atual baseada no tipo
    IF v_item_type = 'ebook' THEN
        SELECT count(*) INTO v_total_items FROM public.ebook_chapters WHERE ebook_id = v_item_id;
        SELECT count(*) INTO v_completed_items 
        FROM public.ebook_progress 
        WHERE user_id = v_user_id AND chapter_id IN (SELECT id FROM public.ebook_chapters WHERE ebook_id = v_item_id) AND completed_at IS NOT NULL;
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
    END IF;

    IF v_total_items > 0 THEN
        v_current_percent := (v_completed_items * 100) / v_total_items;
        
        -- Marcos: 25%, 50%, 75%, 100%
        IF v_current_percent >= 100 AND v_last_milestone < 100 THEN
            INSERT INTO public.notifications (title, message, type, target_type)
            VALUES ('Conclusão Incrível!', 'Parabéns! Você concluiu 100% do conteúdo: ' || v_item_title, 'general', 'segmented')
            RETURNING id INTO v_notification_id;
            
            INSERT INTO public.user_notifications (user_id, notification_id) VALUES (v_user_id, v_notification_id) ON CONFLICT DO NOTHING;
            NEW.last_milestone := 100;
        ELSIF v_current_percent >= 75 AND v_last_milestone < 75 THEN
            INSERT INTO public.notifications (title, message, type, target_type)
            VALUES ('Quase lá!', 'Você já completou 75% de ' || v_item_title || '. Continue assim!', 'general', 'segmented')
            RETURNING id INTO v_notification_id;
            
            INSERT INTO public.user_notifications (user_id, notification_id) VALUES (v_user_id, v_notification_id) ON CONFLICT DO NOTHING;
            NEW.last_milestone := 75;
        ELSIF v_current_percent >= 50 AND v_last_milestone < 50 THEN
            INSERT INTO public.notifications (title, message, type, target_type)
            VALUES ('Metade do caminho!', 'Você atingiu 50% de ' || v_item_title || '. Ótimo progresso!', 'general', 'segmented')
            RETURNING id INTO v_notification_id;
            
            INSERT INTO public.user_notifications (user_id, notification_id) VALUES (v_user_id, v_notification_id) ON CONFLICT DO NOTHING;
            NEW.last_milestone := 50;
        ELSIF v_current_percent >= 25 AND v_last_milestone < 25 THEN
            INSERT INTO public.notifications (title, message, type, target_type)
            VALUES ('Bom começo!', 'Você completou os primeiros 25% de ' || v_item_title, 'general', 'segmented')
            RETURNING id INTO v_notification_id;
            
            INSERT INTO public.user_notifications (user_id, notification_id) VALUES (v_user_id, v_notification_id) ON CONFLICT DO NOTHING;
            NEW.last_milestone := 25;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_progress_milestones() OWNER TO postgres;

--
-- Name: complete_linked_course(text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.complete_linked_course(_ebook_id text, _user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.complete_linked_course(_ebook_id text, _user_id uuid) OWNER TO postgres;

--
-- Name: distribute_partner_profits(numeric, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.distribute_partner_profits(p_amount numeric, p_partner_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Garantir que o registro exista para o sócio
    INSERT INTO public.partner_balances (user_id, balance, total_earned, total_withdrawn)
    VALUES (p_partner_id, p_amount, p_amount, 0)
    ON CONFLICT (user_id) DO UPDATE 
    SET balance = partner_balances.balance + p_amount,
        total_earned = COALESCE(partner_balances.total_earned, 0) + p_amount,
        updated_at = now();
END;
$$;


ALTER FUNCTION public.distribute_partner_profits(p_amount numeric, p_partner_id uuid) OWNER TO postgres;

--
-- Name: enforce_affiliate_field_restrictions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_affiliate_field_restrictions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.commission_rate := OLD.commission_rate;
  NEW.balance := OLD.balance;
  NEW.total_earnings := OLD.total_earnings;
  NEW.status := OLD.status;
  NEW.referrer_id := OLD.referrer_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_affiliate_field_restrictions() OWNER TO postgres;

--
-- Name: enforce_support_ticket_field_restrictions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_support_ticket_field_restrictions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'manager')
     OR public.has_role(auth.uid(), 'agent') THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.priority := OLD.priority;
  NEW.assigned_to := OLD.assigned_to;
  NEW.closed_at := OLD.closed_at;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_support_ticket_field_restrictions() OWNER TO postgres;

--
-- Name: finish_ranking_campaign(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.finish_ranking_campaign(_campaign_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_positions INTEGER[];
    v_is_active BOOLEAN;
BEGIN
    -- Validar se o chamador é admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT start_date, end_date, rewarded_positions, is_active 
    INTO v_start_date, v_end_date, v_positions, v_is_active
    FROM ranking_campaigns WHERE id = _campaign_id;

    IF v_is_active IS NULL OR NOT v_is_active THEN
        RAISE EXCEPTION 'Campanha já encerrada ou inexistente';
    END IF;

    -- Registrar vencedores
    INSERT INTO campaign_winners (campaign_id, user_id, position, points_at_time)
    SELECT 
        _campaign_id, 
        r.user_id, 
        r.global_rank::integer, 
        r.total_points
    FROM get_student_ranking_v2(100, v_start_date, v_end_date) r
    WHERE r.global_rank = ANY(v_positions);

    -- Desativar campanha
    UPDATE ranking_campaigns SET is_active = false, updated_at = now() WHERE id = _campaign_id;
END;
$$;


ALTER FUNCTION public.finish_ranking_campaign(_campaign_id uuid) OWNER TO postgres;

--
-- Name: get_student_ranking(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_student_ranking(p_limit integer DEFAULT 50) RETURNS TABLE(user_id uuid, name text, avatar_url text, total_points integer, global_rank bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p.id, p.name, p.avatar_url, us.total_points,
         dense_rank() OVER (ORDER BY us.total_points DESC)
  FROM public.profiles p
  JOIN public.user_stats us ON p.id = us.user_id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IS NULL OR ur.role <> 'admin'::app_role
  ORDER BY us.total_points DESC
  LIMIT COALESCE(p_limit, 50)
$$;


ALTER FUNCTION public.get_student_ranking(p_limit integer) OWNER TO postgres;

--
-- Name: get_student_ranking_v2(integer, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_student_ranking_v2(p_limit integer DEFAULT 50, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE(user_id uuid, name text, avatar_url text, total_points integer, global_rank bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      p.id AS u_id,
      CASE 
        WHEN public.has_role(auth.uid(), 'admin') THEN COALESCE(p.name, 'Aluno #' || substring(p.id::text, 1, 4))
        ELSE COALESCE(p.name, 'Aluno #' || substring(p.id::text, 1, 4))
      END AS u_name,
      p.avatar_url AS u_avatar,
      CASE
        WHEN p_start_date IS NULL AND p_end_date IS NULL
          THEN COALESCE(us.total_points, 0)
        ELSE COALESCE((
          SELECT SUM(pt.points_awarded)::integer
          FROM public.progress_tracking pt
          WHERE pt.user_id = p.id
            AND pt.completed_at IS NOT NULL
            AND (p_start_date IS NULL OR pt.completed_at >= p_start_date)
            AND (p_end_date IS NULL OR pt.completed_at <= p_end_date)
        ), 0)
      END AS u_points
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON us.user_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
    )
  )
  SELECT
    s.u_id,
    s.u_name,
    s.u_avatar,
    s.u_points,
    dense_rank() OVER (ORDER BY s.u_points DESC) AS g_rank
  FROM scored s
  ORDER BY s.u_points DESC
  LIMIT COALESCE(p_limit, 50);
END;
$$;


ALTER FUNCTION public.get_student_ranking_v2(p_limit integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) OWNER TO postgres;

--
-- Name: handle_item_completion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_item_completion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_duration INTERVAL;
    v_points INTEGER := 0;
    v_base_points INTEGER := 0;
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        v_duration := NEW.completed_at - NEW.started_at;
        
        CASE NEW.item_type
            WHEN 'module' THEN v_base_points := 10;
            WHEN 'ebook_module' THEN v_base_points := 10;
            WHEN 'course' THEN v_base_points := 50;
            WHEN 'ebook' THEN v_base_points := 50;
        END CASE;

        v_points := v_base_points;

        -- Speed bonus
        IF v_duration < INTERVAL '24 hours' THEN
            v_points := v_points + (v_base_points / 2);
        ELSIF v_duration < INTERVAL '48 hours' THEN
            v_points := v_points + (v_base_points / 4);
        END IF;

        NEW.points_awarded := v_points;
        PERFORM public.award_points(NEW.user_id, v_points);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_item_completion() OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: has_any_enrollment(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_any_enrollment(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.course_enrollments WHERE user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.ebook_enrollments WHERE user_id = _user_id)
$$;


ALTER FUNCTION public.has_any_enrollment(_user_id uuid) OWNER TO postgres;

--
-- Name: has_module_access(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_module_access(_user_id uuid, _module text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    -- Admins têm acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
    UNION ALL
    -- Outros perfis dependem da tabela de permissões
    SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND module = _module AND can_access = TRUE
  );
$$;


ALTER FUNCTION public.has_module_access(_user_id uuid, _module text) OWNER TO postgres;

--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) OWNER TO postgres;

--
-- Name: increment_affiliate_earnings(uuid, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_affiliate_earnings(aff_id uuid, amount_to_add numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.affiliates
    SET total_earnings = total_earnings + amount_to_add,
        balance = balance + amount_to_add,
        updated_at = now()
    WHERE id = aff_id;
END;
$$;


ALTER FUNCTION public.increment_affiliate_earnings(aff_id uuid, amount_to_add numeric) OWNER TO postgres;

--
-- Name: increment_partner_withdrawn(uuid, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_partner_withdrawn(p_user_id uuid, p_amount numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.partner_balances 
    SET total_withdrawn = total_withdrawn + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.increment_partner_withdrawn(p_user_id uuid, p_amount numeric) OWNER TO postgres;

--
-- Name: log_system_event(text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_system_event(_level text, _source text, _message text, _details jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    _log_id UUID;
BEGIN
    INSERT INTO public.system_logs (level, source, message, details, user_id)
    VALUES (_level, _source, _message, _details, auth.uid())
    RETURNING id INTO _log_id;
    
    RETURN _log_id;
END;
$$;


ALTER FUNCTION public.log_system_event(_level text, _source text, _message text, _details jsonb) OWNER TO postgres;

--
-- Name: log_unhandled_question_v2(text, double precision, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_unhandled_question_v2(p_message text, p_confidence double precision, p_context jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.unhandled_questions (question, confidence, context, status)
  VALUES (p_message, p_confidence, p_context, 'pending');
END;
$$;


ALTER FUNCTION public.log_unhandled_question_v2(p_message text, p_confidence double precision, p_context jsonb) OWNER TO postgres;

--
-- Name: notify_new_feedback(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_new_feedback() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  item_title TEXT;
BEGIN
  -- Get item title (course or ebook)
  IF NEW.course_id IS NOT NULL THEN
    SELECT title INTO item_title FROM public.courses WHERE id = NEW.course_id;
  ELSE
    SELECT title INTO item_title FROM public.ebooks WHERE id = NEW.ebook_id;
  END IF;

  -- Create notification record for admins
  INSERT INTO public.notifications (
    title,
    message,
    type,
    target_type,
    metadata
  ) VALUES (
    'Novo Feedback Recebido',
    'Um novo feedback foi enviado para o item: ' || COALESCE(item_title, 'Item Desconhecido'),
    'feedback',
    'all',
    jsonb_build_object(
      'feedback_id', NEW.id,
      'item_title', item_title,
      'rating', NEW.rating,
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_new_feedback() OWNER TO postgres;

--
-- Name: promote_to_student(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.promote_to_student() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles 
  SET status = 'student' 
  WHERE id = NEW.user_id 
    AND (status IS NULL OR status = 'lead');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.promote_to_student() OWNER TO postgres;

--
-- Name: protect_profile_privileged_fields(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_profile_privileged_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.protect_profile_privileged_fields() OWNER TO postgres;

--
-- Name: protect_support_ticket_staff_fields(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_support_ticket_staff_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT (
       public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'manager')
       OR public.has_role(auth.uid(), 'agent')
     )
  THEN
    NEW.assigned_to := OLD.assigned_to;
    NEW.priority := OLD.priority;
    NEW.status := OLD.status;
    NEW.category := OLD.category;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.protect_support_ticket_staff_fields() OWNER TO postgres;

--
-- Name: save_assistant_response(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_assistant_response(p_ticket_id uuid, p_content text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Verificar se o ticket pertence ao usuário atual (ou se é service_role)
    IF NOT EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = p_ticket_id 
        AND (user_id = auth.uid() OR auth.role() = 'service_role')
    ) THEN
        RAISE EXCEPTION 'Acesso negado ao ticket';
    END IF;

    INSERT INTO public.support_messages (ticket_id, content, sender_type)
    VALUES (p_ticket_id, p_content, 'assistant');
END;
$$;


ALTER FUNCTION public.save_assistant_response(p_ticket_id uuid, p_content text) OWNER TO postgres;

--
-- Name: sync_report_cron(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_report_cron() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    cron_time TEXT;
    project_url TEXT;
BEGIN
    project_url := 'https://espetinhonaveia.lovable.app/api/public/daily-financial-report';
    
    -- Unschedule existing if it exists, ignore if not found
    BEGIN
        PERFORM cron.unschedule('daily_financial_report');
    EXCEPTION WHEN OTHERS THEN
        -- Do nothing if job doesn't exist
    END;
    
    IF NEW.enabled = true THEN
        cron_time := split_part(NEW.send_time, ':', 2) || ' ' || split_part(NEW.send_time, ':', 1) || ' * * *';
        
        PERFORM cron.schedule(
            'daily_financial_report',
            cron_time,
            format('SELECT net.http_post(
                url := %L,
                headers := jsonb_build_object(
                    ''Content-Type'', ''application/json'',
                    ''Authorization'', ''Bearer '' || current_setting(''app.report_internal_secret'', true)
                ),
                body := ''{}''::jsonb
            )', project_url)
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_report_cron() OWNER TO postgres;

--
-- Name: update_expired_live_classes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_expired_live_classes() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Update classes that are scheduled but their time has passed (+ 4 hours of buffer for live duration)
    UPDATE public.live_classes
    SET status = 'completed'
    WHERE status IN ('scheduled', 'live')
      AND scheduled_at < NOW() - INTERVAL '4 hours';
END;
$$;


ALTER FUNCTION public.update_expired_live_classes() OWNER TO postgres;

--
-- Name: update_payout_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payout_requests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_payout_requests_updated_at() OWNER TO postgres;

--
-- Name: update_ticket_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ticket_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.support_tickets
    SET updated_at = now()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ticket_timestamp() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module text NOT NULL,
    can_access boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_permissions OWNER TO postgres;

--
-- Name: affiliate_custom_commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_custom_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    course_id uuid NOT NULL,
    commission_rate numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.affiliate_custom_commissions OWNER TO postgres;

--
-- Name: affiliate_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    course_id text,
    code text NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.affiliate_links OWNER TO postgres;

--
-- Name: affiliate_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'banner'::text NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.affiliate_materials OWNER TO postgres;

--
-- Name: affiliate_sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid,
    course_id text,
    amount numeric(12,2) NOT NULL,
    commission numeric(12,2) NOT NULL,
    status public.affiliate_sale_status DEFAULT 'pending'::public.affiliate_sale_status NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.affiliate_sales OWNER TO postgres;

--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliates (
    id uuid NOT NULL,
    status public.affiliate_status DEFAULT 'pending'::public.affiliate_status NOT NULL,
    commission_rate numeric(5,2) DEFAULT 30.00 NOT NULL,
    pix_key text,
    bank_info jsonb DEFAULT '{}'::jsonb,
    total_earnings numeric(12,2) DEFAULT 0.00 NOT NULL,
    balance numeric(12,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    referrer_id uuid
);


ALTER TABLE public.affiliates OWNER TO postgres;

--
-- Name: asaas_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asaas_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asaas_id text,
    amount numeric NOT NULL,
    status text NOT NULL,
    transfer_date timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    transaction_type text DEFAULT 'transfer'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.asaas_transfers OWNER TO postgres;

--
-- Name: asaas_webhook_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asaas_webhook_events (
    event_id text NOT NULL,
    payment_id text NOT NULL,
    event_type text NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    claimed_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    last_error text,
    payload jsonb,
    claim_token uuid
);


ALTER TABLE public.asaas_webhook_events OWNER TO postgres;

--
-- Name: campaign_winners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaign_winners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    user_id uuid,
    "position" integer NOT NULL,
    points_at_time integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.campaign_winners OWNER TO postgres;

--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificate_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    background_url text,
    html_content text,
    css_content text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_default boolean DEFAULT false
);


ALTER TABLE public.certificate_templates OWNER TO postgres;

--
-- Name: certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    content_id text NOT NULL,
    content_type text NOT NULL,
    template_id uuid,
    certificate_code text NOT NULL,
    issue_date timestamp with time zone DEFAULT now(),
    custom_data jsonb DEFAULT '{}'::jsonb,
    is_revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    revocation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    city_of_issue text,
    CONSTRAINT certificates_content_type_check CHECK ((content_type = ANY (ARRAY['course'::text, 'ebook'::text])))
);


ALTER TABLE public.certificates OWNER TO postgres;

--
-- Name: content_certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content_certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id text NOT NULL,
    content_type text NOT NULL,
    template_id uuid,
    is_enabled boolean DEFAULT false,
    min_progress_percentage integer DEFAULT 100,
    custom_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    city_of_issue text DEFAULT 'Goiânia - Goiás'::text,
    CONSTRAINT content_certificates_content_type_check CHECK ((content_type = ANY (ARRAY['course'::text, 'ebook'::text])))
);


ALTER TABLE public.content_certificates OWNER TO postgres;

--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.course_enrollments OWNER TO postgres;

--
-- Name: course_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id text,
    rating integer NOT NULL,
    comment text,
    video_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_reply text,
    ebook_id text,
    CONSTRAINT course_feedback_item_id_check CHECK ((((course_id IS NOT NULL) AND (ebook_id IS NULL)) OR ((course_id IS NULL) AND (ebook_id IS NOT NULL)))),
    CONSTRAINT course_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT course_feedback_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.course_feedback OWNER TO postgres;

--
-- Name: course_lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    video_url text,
    content text,
    duration_minutes integer DEFAULT 0,
    order_index integer DEFAULT 0,
    is_free boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.course_lessons OWNER TO postgres;

--
-- Name: course_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id text NOT NULL,
    title text NOT NULL,
    description text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    video_url text
);


ALTER TABLE public.course_modules OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    cover_url text,
    teacher_name text,
    price numeric(10,2),
    is_locked boolean DEFAULT false,
    badge text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_ai_generated boolean DEFAULT false,
    content_url text,
    slug text,
    intro_video_url text,
    level text DEFAULT 'beginner'::text,
    status text DEFAULT 'draft'::text,
    order_index integer DEFAULT 0,
    payment_type text DEFAULT 'unique'::text,
    due_days integer DEFAULT 3,
    checkpoints jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: ebook_chapters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebook_chapters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ebook_id text NOT NULL,
    module_id uuid,
    title text NOT NULL,
    slug text,
    content text,
    video_url text,
    order_index integer DEFAULT 0 NOT NULL,
    reading_minutes integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ebook_chapters OWNER TO postgres;

--
-- Name: ebook_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebook_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ebook_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ebook_enrollments OWNER TO postgres;

--
-- Name: ebook_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebook_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ebook_id text NOT NULL,
    title text NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ebook_modules OWNER TO postgres;

--
-- Name: ebook_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebook_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chapter_id uuid NOT NULL,
    completed_at timestamp with time zone,
    last_read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ebook_progress OWNER TO postgres;

--
-- Name: ebooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebooks (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    cover text,
    cover_url text,
    price numeric(10,2) DEFAULT 0,
    original_price numeric(10,2) DEFAULT 0,
    is_locked boolean DEFAULT false,
    is_ai_generated boolean DEFAULT false,
    content_url text,
    video_url text,
    pages_count integer,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    opening_video_url text,
    payment_type text DEFAULT 'unique'::text,
    due_days integer DEFAULT 3,
    checkpoints jsonb DEFAULT '[]'::jsonb,
    keywords text[] DEFAULT '{}'::text[],
    status text DEFAULT 'active'::text,
    badge text,
    course_id text
);


ALTER TABLE public.ebooks OWNER TO postgres;

--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_email text NOT NULL,
    template_name text NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    provider_message_id text,
    error_message text,
    payload jsonb,
    idempotency_key text,
    created_at timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone
);


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_name text DEFAULT 'Suporte'::text NOT NULL,
    from_email text DEFAULT 'suporte@seudominio.com'::text NOT NULL,
    reply_to text,
    is_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    validation_status text DEFAULT 'pending'::text,
    last_validation_at timestamp with time zone,
    validation_error text
);


ALTER TABLE public.email_settings OWNER TO postgres;

--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    content_html text NOT NULL,
    content_text text,
    description text,
    variables jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- Name: email_templates_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_name text NOT NULL,
    subject text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_templates_config OWNER TO postgres;

--
-- Name: financial_costs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_costs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    value numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.financial_costs OWNER TO postgres;

--
-- Name: financial_partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    percent numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid
);


ALTER TABLE public.financial_partners OWNER TO postgres;

--
-- Name: financial_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_settings (
    id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    manual_revenue numeric(15,2) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_revenue numeric(15,2) DEFAULT 0
);


ALTER TABLE public.financial_settings OWNER TO postgres;

--
-- Name: integration_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integration_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    integration_name text NOT NULL,
    status text NOT NULL,
    message text,
    latency text,
    details jsonb DEFAULT '{}'::jsonb,
    http_code integer,
    endpoint text,
    environment text,
    response_body jsonb,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.integration_logs OWNER TO postgres;

--
-- Name: integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type public.integration_type NOT NULL,
    category text NOT NULL,
    status boolean DEFAULT false,
    credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.integrations OWNER TO postgres;

--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category public.knowledge_category DEFAULT 'SUPORTE'::public.knowledge_category NOT NULL,
    questions text[] DEFAULT '{}'::text[],
    keywords text[] DEFAULT '{}'::text[],
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.knowledge_base OWNER TO postgres;

--
-- Name: knowledge_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    knowledge_id uuid,
    user_id uuid,
    is_positive boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.knowledge_feedback OWNER TO postgres;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    email text NOT NULL,
    phone text,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    lesson_id uuid,
    is_completed boolean DEFAULT false,
    last_position_seconds integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lesson_progress OWNER TO postgres;

--
-- Name: live_classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.live_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    scheduled_at timestamp with time zone NOT NULL,
    link text,
    materials_url text,
    status public.live_class_status DEFAULT 'scheduled'::public.live_class_status,
    created_at timestamp with time zone DEFAULT now(),
    cover_url text
);


ALTER TABLE public.live_classes OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    target_type text NOT NULL,
    sent_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT notifications_target_type_check CHECK ((target_type = ANY (ARRAY['all'::text, 'segmented'::text]))),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['general'::text, 'course'::text, 'lesson'::text, 'live'::text, 'feedback'::text])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: partner_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partner_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_withdrawn numeric(12,2) DEFAULT 0.00 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    total_earned numeric(10,2) DEFAULT 0
);


ALTER TABLE public.partner_balances OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_id text NOT NULL,
    user_id uuid,
    amount numeric(12,2) NOT NULL,
    net_amount numeric(12,2) NOT NULL,
    fee numeric(12,2) NOT NULL,
    status text NOT NULL,
    billing_type text,
    external_reference text,
    customer_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payout_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payout_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    status public.payout_status DEFAULT 'pending'::public.payout_status NOT NULL,
    method text NOT NULL,
    pix_key text,
    asaas_payment_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payout_requests_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.payout_requests OWNER TO postgres;

--
-- Name: pending_checkouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_checkouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    product_id uuid NOT NULL,
    product_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pending_checkouts_product_type_check CHECK ((product_type = ANY (ARRAY['course'::text, 'ebook'::text]))),
    CONSTRAINT pending_checkouts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'expired'::text])))
);


ALTER TABLE public.pending_checkouts OWNER TO postgres;

--
-- Name: platform_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    file_url text,
    external_url text,
    category text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.platform_materials OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    email_notifications_opt_in boolean DEFAULT true,
    status text DEFAULT 'lead'::text,
    CONSTRAINT phone_required_check CHECK (((phone IS NOT NULL) OR (created_at < '2026-08-18 00:00:00+00'::timestamp with time zone)))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: progress_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progress_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_type text NOT NULL,
    item_id text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    points_awarded integer DEFAULT 0,
    last_milestone integer DEFAULT 0,
    CONSTRAINT progress_tracking_item_type_check CHECK ((item_type = ANY (ARRAY['module'::text, 'course'::text, 'ebook_module'::text, 'ebook'::text])))
);


ALTER TABLE public.progress_tracking OWNER TO postgres;

--
-- Name: ranking_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ranking_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    prize_description text NOT NULL,
    rewarded_positions integer[] NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ranking_campaigns OWNER TO postgres;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text,
    image_url text,
    ingredients text[],
    yield text,
    prep_time text,
    difficulty public.difficulty_level DEFAULT 'Fácil'::public.difficulty_level,
    steps text[],
    cost text,
    sell_price text,
    profit_margin text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_published boolean DEFAULT true,
    video_url text
);


ALTER TABLE public.recipes OWNER TO postgres;

--
-- Name: report_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid,
    report_date date NOT NULL,
    status text NOT NULL,
    provider_message_id text,
    error text,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT report_logs_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'skipped'::text])))
);


ALTER TABLE public.report_logs OWNER TO postgres;

--
-- Name: report_recipients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone_e164 text,
    active boolean DEFAULT true NOT NULL,
    report_types text[] DEFAULT '{financial}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    CONSTRAINT report_recipients_phone_e164_check CHECK ((phone_e164 ~ '^\+?[1-9]\d{1,14}$'::text))
);


ALTER TABLE public.report_recipients OWNER TO postgres;

--
-- Name: report_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_settings (
    id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    send_time text DEFAULT '08:00'::text NOT NULL,
    timezone text DEFAULT 'America/Sao_Paulo'::text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    send_when_no_activity boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_method text DEFAULT 'email'::text,
    recipients text[],
    CONSTRAINT singleton_check CHECK ((id = '00000000-0000-0000-0000-000000000000'::uuid))
);


ALTER TABLE public.report_settings OWNER TO postgres;

--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    sender_id uuid,
    sender_type public.support_sender_type NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    CONSTRAINT support_messages_message_check CHECK ((message <> ''::text))
);


ALTER TABLE public.support_messages OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    subject text,
    legacy_message text,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    priority text DEFAULT 'normal'::text,
    assigned_to uuid,
    updated_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    category text
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level text NOT NULL,
    source text NOT NULL,
    message text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid,
    CONSTRAINT system_logs_level_check CHECK ((level = ANY (ARRAY['ERROR'::text, 'WARNING'::text, 'INFO'::text, 'DEBUG'::text])))
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: unhandled_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unhandled_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    confidence double precision DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.unhandled_questions OWNER TO postgres;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notification_id uuid NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: user_onboarding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_onboarding (
    user_id uuid NOT NULL,
    has_seen_onboarding boolean DEFAULT false,
    last_seen_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_onboarding OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_stats (
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    rank integer,
    level integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_stats OWNER TO postgres;

--
-- Name: whatsapp_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.whatsapp_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'disconnected'::text,
    qr_code text,
    session_data jsonb,
    phone_number text,
    last_connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT whatsapp_instances_status_check CHECK ((status = ANY (ARRAY['disconnected'::text, 'connecting'::text, 'connected'::text])))
);


ALTER TABLE public.whatsapp_instances OWNER TO postgres;

--
-- Name: admin_permissions admin_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_pkey PRIMARY KEY (id);


--
-- Name: admin_permissions admin_permissions_user_id_module_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_user_id_module_key UNIQUE (user_id, module);


--
-- Name: affiliate_custom_commissions affiliate_custom_commissions_affiliate_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_custom_commissions
    ADD CONSTRAINT affiliate_custom_commissions_affiliate_id_course_id_key UNIQUE (affiliate_id, course_id);


--
-- Name: affiliate_custom_commissions affiliate_custom_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_custom_commissions
    ADD CONSTRAINT affiliate_custom_commissions_pkey PRIMARY KEY (id);


--
-- Name: affiliate_links affiliate_links_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_links
    ADD CONSTRAINT affiliate_links_code_key UNIQUE (code);


--
-- Name: affiliate_links affiliate_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_links
    ADD CONSTRAINT affiliate_links_pkey PRIMARY KEY (id);


--
-- Name: affiliate_materials affiliate_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_materials
    ADD CONSTRAINT affiliate_materials_pkey PRIMARY KEY (id);


--
-- Name: affiliate_sales affiliate_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_sales
    ADD CONSTRAINT affiliate_sales_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);


--
-- Name: asaas_transfers asaas_transfers_asaas_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asaas_transfers
    ADD CONSTRAINT asaas_transfers_asaas_id_key UNIQUE (asaas_id);


--
-- Name: asaas_transfers asaas_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asaas_transfers
    ADD CONSTRAINT asaas_transfers_pkey PRIMARY KEY (id);


--
-- Name: asaas_webhook_events asaas_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asaas_webhook_events
    ADD CONSTRAINT asaas_webhook_events_pkey PRIMARY KEY (event_id);


--
-- Name: campaign_winners campaign_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_winners
    ADD CONSTRAINT campaign_winners_pkey PRIMARY KEY (id);


--
-- Name: certificate_templates certificate_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_certificate_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_code_key UNIQUE (certificate_code);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: content_certificates content_certificates_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_certificates
    ADD CONSTRAINT content_certificates_content_id_key UNIQUE (content_id);


--
-- Name: content_certificates content_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_certificates
    ADD CONSTRAINT content_certificates_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: course_feedback course_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_feedback
    ADD CONSTRAINT course_feedback_pkey PRIMARY KEY (id);


--
-- Name: course_feedback course_feedback_user_course_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_feedback
    ADD CONSTRAINT course_feedback_user_course_unique UNIQUE (user_id, course_id);


--
-- Name: course_feedback course_feedback_user_ebook_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_feedback
    ADD CONSTRAINT course_feedback_user_ebook_unique UNIQUE (user_id, ebook_id);


--
-- Name: course_lessons course_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_lessons_pkey PRIMARY KEY (id);


--
-- Name: course_modules course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: ebook_chapters ebook_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_chapters
    ADD CONSTRAINT ebook_chapters_pkey PRIMARY KEY (id);


--
-- Name: ebook_enrollments ebook_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_enrollments
    ADD CONSTRAINT ebook_enrollments_pkey PRIMARY KEY (id);


--
-- Name: ebook_enrollments ebook_enrollments_user_id_ebook_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_enrollments
    ADD CONSTRAINT ebook_enrollments_user_id_ebook_id_key UNIQUE (user_id, ebook_id);


--
-- Name: ebook_modules ebook_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_modules
    ADD CONSTRAINT ebook_modules_pkey PRIMARY KEY (id);


--
-- Name: ebook_progress ebook_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_progress
    ADD CONSTRAINT ebook_progress_pkey PRIMARY KEY (id);


--
-- Name: ebook_progress ebook_progress_user_id_chapter_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_progress
    ADD CONSTRAINT ebook_progress_user_id_chapter_id_key UNIQUE (user_id, chapter_id);


--
-- Name: ebooks ebooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebooks
    ADD CONSTRAINT ebooks_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: email_templates_config email_templates_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates_config
    ADD CONSTRAINT email_templates_config_pkey PRIMARY KEY (id);


--
-- Name: email_templates_config email_templates_config_template_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates_config
    ADD CONSTRAINT email_templates_config_template_name_key UNIQUE (template_name);


--
-- Name: email_templates email_templates_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_name_key UNIQUE (name);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: financial_costs financial_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_costs
    ADD CONSTRAINT financial_costs_pkey PRIMARY KEY (id);


--
-- Name: financial_partners financial_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_partners
    ADD CONSTRAINT financial_partners_pkey PRIMARY KEY (id);


--
-- Name: financial_settings financial_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_settings
    ADD CONSTRAINT financial_settings_pkey PRIMARY KEY (id);


--
-- Name: integration_logs integration_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_category_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_category_unique UNIQUE (category);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: knowledge_feedback knowledge_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_feedback
    ADD CONSTRAINT knowledge_feedback_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: live_classes live_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partner_balances partner_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_balances
    ADD CONSTRAINT partner_balances_pkey PRIMARY KEY (id);


--
-- Name: partner_balances partner_balances_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_balances
    ADD CONSTRAINT partner_balances_user_id_key UNIQUE (user_id);


--
-- Name: payments payments_external_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_external_id_key UNIQUE (external_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payout_requests payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);


--
-- Name: pending_checkouts pending_checkouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_checkouts
    ADD CONSTRAINT pending_checkouts_pkey PRIMARY KEY (id);


--
-- Name: platform_materials platform_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_materials
    ADD CONSTRAINT platform_materials_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: progress_tracking progress_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_pkey PRIMARY KEY (id);


--
-- Name: progress_tracking progress_tracking_user_id_item_type_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_user_id_item_type_item_id_key UNIQUE (user_id, item_type, item_id);


--
-- Name: ranking_campaigns ranking_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_campaigns
    ADD CONSTRAINT ranking_campaigns_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_name_key UNIQUE (name);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: report_logs report_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_logs
    ADD CONSTRAINT report_logs_pkey PRIMARY KEY (id);


--
-- Name: report_recipients report_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_recipients
    ADD CONSTRAINT report_recipients_pkey PRIMARY KEY (id);


--
-- Name: report_settings report_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_settings
    ADD CONSTRAINT report_settings_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: unhandled_questions unhandled_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unhandled_questions
    ADD CONSTRAINT unhandled_questions_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_user_id_notification_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_notification_id_key UNIQUE (user_id, notification_id);


--
-- Name: user_onboarding user_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_pkey PRIMARY KEY (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (user_id);


--
-- Name: whatsapp_instances whatsapp_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_instances
    ADD CONSTRAINT whatsapp_instances_pkey PRIMARY KEY (id);


--
-- Name: idx_asaas_webhook_status_claimed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asaas_webhook_status_claimed ON public.asaas_webhook_events USING btree (status, claimed_at);


--
-- Name: idx_course_enrollments_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments USING btree (course_id);


--
-- Name: idx_course_enrollments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments USING btree (user_id);


--
-- Name: idx_course_lessons_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_lessons_module_id ON public.course_lessons USING btree (module_id);


--
-- Name: idx_course_lessons_order_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_lessons_order_index ON public.course_lessons USING btree (order_index);


--
-- Name: idx_course_modules_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_modules_course_id ON public.course_modules USING btree (course_id);


--
-- Name: idx_courses_is_locked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_is_locked ON public.courses USING btree (is_locked);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_ebook_chapters_ebook_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebook_chapters_ebook_id ON public.ebook_chapters USING btree (ebook_id);


--
-- Name: idx_ebook_chapters_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebook_chapters_module_id ON public.ebook_chapters USING btree (module_id);


--
-- Name: idx_ebook_enrollments_ebook_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebook_enrollments_ebook_id ON public.ebook_enrollments USING btree (ebook_id);


--
-- Name: idx_ebook_enrollments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebook_enrollments_user_id ON public.ebook_enrollments USING btree (user_id);


--
-- Name: idx_ebook_modules_ebook_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebook_modules_ebook_id ON public.ebook_modules USING btree (ebook_id);


--
-- Name: idx_ebook_progress_user_id_chapter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebook_progress_user_id_chapter_id ON public.ebook_progress USING btree (user_id, chapter_id);


--
-- Name: idx_ebooks_is_locked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebooks_is_locked ON public.ebooks USING btree (is_locked);


--
-- Name: idx_ebooks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ebooks_status ON public.ebooks USING btree (status);


--
-- Name: idx_lesson_progress_user_id_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_user_id_lesson_id ON public.lesson_progress USING btree (user_id, lesson_id);


--
-- Name: idx_payout_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payout_requests_status ON public.payout_requests USING btree (status);


--
-- Name: idx_payout_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payout_requests_user_id ON public.payout_requests USING btree (user_id);


--
-- Name: idx_profiles_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at DESC);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);


--
-- Name: idx_support_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_messages_created_at ON public.support_messages USING btree (created_at);


--
-- Name: idx_support_messages_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages USING btree (ticket_id);


--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_system_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at DESC);


--
-- Name: idx_system_logs_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_level ON public.system_logs USING btree (level);


--
-- Name: idx_system_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_user_id ON public.system_logs USING btree (user_id);


--
-- Name: course_enrollments on_course_enrollment_promote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_course_enrollment_promote AFTER INSERT ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.promote_to_student();


--
-- Name: ebook_enrollments on_ebook_enrollment_promote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_ebook_enrollment_promote AFTER INSERT ON public.ebook_enrollments FOR EACH ROW EXECUTE FUNCTION public.promote_to_student();


--
-- Name: progress_tracking on_item_completion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_item_completion BEFORE UPDATE ON public.progress_tracking FOR EACH ROW EXECUTE FUNCTION public.handle_item_completion();


--
-- Name: report_settings on_report_settings_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_report_settings_update AFTER UPDATE ON public.report_settings FOR EACH ROW EXECUTE FUNCTION public.sync_report_cron();


--
-- Name: support_messages on_support_message_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_support_message_insert AFTER INSERT ON public.support_messages FOR EACH ROW EXECUTE FUNCTION public.update_ticket_timestamp();


--
-- Name: profiles protect_profile_privileged_fields_trg; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER protect_profile_privileged_fields_trg BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();


--
-- Name: support_tickets protect_support_ticket_staff_fields_trg; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER protect_support_ticket_staff_fields_trg BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.protect_support_ticket_staff_fields();


--
-- Name: progress_tracking tr_check_progress_milestones; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_check_progress_milestones BEFORE UPDATE ON public.progress_tracking FOR EACH ROW WHEN ((new.item_type = ANY (ARRAY['course'::text, 'ebook'::text]))) EXECUTE FUNCTION public.check_progress_milestones();


--
-- Name: course_feedback tr_notify_new_feedback; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_notify_new_feedback AFTER INSERT ON public.course_feedback FOR EACH ROW EXECUTE FUNCTION public.notify_new_feedback();


--
-- Name: affiliates trg_enforce_affiliate_field_restrictions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_affiliate_field_restrictions BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.enforce_affiliate_field_restrictions();


--
-- Name: support_tickets trg_enforce_support_ticket_field_restrictions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_support_ticket_field_restrictions BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.enforce_support_ticket_field_restrictions();


--
-- Name: payout_requests trigger_update_payout_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_payout_requests_updated_at BEFORE UPDATE ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION public.update_payout_requests_updated_at();


--
-- Name: platform_materials update_platform_materials_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_platform_materials_updated_at BEFORE UPDATE ON public.platform_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_permissions admin_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: affiliate_custom_commissions affiliate_custom_commissions_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_custom_commissions
    ADD CONSTRAINT affiliate_custom_commissions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;


--
-- Name: affiliate_links affiliate_links_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_links
    ADD CONSTRAINT affiliate_links_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;


--
-- Name: affiliate_links affiliate_links_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_links
    ADD CONSTRAINT affiliate_links_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: affiliate_sales affiliate_sales_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_sales
    ADD CONSTRAINT affiliate_sales_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE SET NULL;


--
-- Name: affiliate_sales affiliate_sales_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_sales
    ADD CONSTRAINT affiliate_sales_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: affiliates affiliates_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: affiliates affiliates_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.affiliates(id);


--
-- Name: campaign_winners campaign_winners_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_winners
    ADD CONSTRAINT campaign_winners_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ranking_campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_winners campaign_winners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_winners
    ADD CONSTRAINT campaign_winners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;


--
-- Name: content_certificates content_certificates_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_certificates
    ADD CONSTRAINT content_certificates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;


--
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: course_feedback course_feedback_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_feedback
    ADD CONSTRAINT course_feedback_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_feedback course_feedback_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_feedback
    ADD CONSTRAINT course_feedback_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.ebooks(id) ON DELETE CASCADE;


--
-- Name: course_feedback course_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_feedback
    ADD CONSTRAINT course_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: course_lessons course_lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE CASCADE;


--
-- Name: course_modules course_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: ebook_chapters ebook_chapters_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_chapters
    ADD CONSTRAINT ebook_chapters_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.ebooks(id) ON DELETE CASCADE;


--
-- Name: ebook_chapters ebook_chapters_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_chapters
    ADD CONSTRAINT ebook_chapters_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.ebook_modules(id) ON DELETE SET NULL;


--
-- Name: ebook_enrollments ebook_enrollments_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_enrollments
    ADD CONSTRAINT ebook_enrollments_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.ebooks(id) ON DELETE CASCADE;


--
-- Name: ebook_enrollments ebook_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_enrollments
    ADD CONSTRAINT ebook_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ebook_modules ebook_modules_ebook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_modules
    ADD CONSTRAINT ebook_modules_ebook_id_fkey FOREIGN KEY (ebook_id) REFERENCES public.ebooks(id) ON DELETE CASCADE;


--
-- Name: ebook_progress ebook_progress_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_progress
    ADD CONSTRAINT ebook_progress_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.ebook_chapters(id) ON DELETE CASCADE;


--
-- Name: ebook_progress ebook_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebook_progress
    ADD CONSTRAINT ebook_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ebooks ebooks_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebooks
    ADD CONSTRAINT ebooks_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: financial_partners financial_partners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_partners
    ADD CONSTRAINT financial_partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: integration_logs integration_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_logs
    ADD CONSTRAINT integration_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: knowledge_feedback knowledge_feedback_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_feedback
    ADD CONSTRAINT knowledge_feedback_knowledge_id_fkey FOREIGN KEY (knowledge_id) REFERENCES public.knowledge_base(id) ON DELETE CASCADE;


--
-- Name: knowledge_feedback knowledge_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_feedback
    ADD CONSTRAINT knowledge_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id);


--
-- Name: partner_balances partner_balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_balances
    ADD CONSTRAINT partner_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: payout_requests payout_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pending_checkouts pending_checkouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_checkouts
    ADD CONSTRAINT pending_checkouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: progress_tracking progress_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: report_logs report_logs_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_logs
    ADD CONSTRAINT report_logs_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.report_recipients(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: support_messages support_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: unhandled_questions unhandled_questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unhandled_questions
    ADD CONSTRAINT unhandled_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_notifications user_notifications_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_onboarding user_onboarding_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_stats user_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: affiliate_custom_commissions Admin can manage custom commissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can manage custom commissions" ON public.affiliate_custom_commissions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: affiliate_materials Admin can manage materials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can manage materials" ON public.affiliate_materials TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_settings Admins can delete email settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete email settings" ON public.email_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_settings Admins can insert email settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert email settings" ON public.email_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can insert messages to any ticket; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert messages to any ticket" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_permissions Admins can manage admin_permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage admin_permissions" ON public.admin_permissions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: affiliates Admins can manage all affiliates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all affiliates" ON public.affiliates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: certificates Admins can manage all certificates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all certificates" ON public.certificates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_enrollments Admins can manage all course enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all course enrollments" ON public.course_enrollments TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_feedback Admins can manage all feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all feedback" ON public.course_feedback TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: partner_balances Admins can manage all partner balances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all partner balances" ON public.partner_balances TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payout_requests Admins can manage all payout requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: affiliate_sales Admins can manage all sales; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all sales" ON public.affiliate_sales TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: certificate_templates Admins can manage certificate templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage certificate templates" ON public.certificate_templates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ebook_chapters Admins can manage chapters; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage chapters" ON public.ebook_chapters TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: content_certificates Admins can manage content certificates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage content certificates" ON public.content_certificates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_lessons Admins can manage course lessons; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage course lessons" ON public.course_lessons TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: course_modules Admins can manage course modules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage course modules" ON public.course_modules TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: courses Admins can manage courses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage courses" ON public.courses TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ebook_chapters Admins can manage ebook chapters; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage ebook chapters" ON public.ebook_chapters TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role]))))));


--
-- Name: ebook_modules Admins can manage ebook modules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage ebook modules" ON public.ebook_modules TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role]))))));


--
-- Name: ebooks Admins can manage ebooks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage ebooks" ON public.ebooks TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_templates Admins can manage email templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage email templates" ON public.email_templates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_templates_config Admins can manage email templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage email templates" ON public.email_templates_config TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ebook_enrollments Admins can manage enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage enrollments" ON public.ebook_enrollments TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: financial_costs Admins can manage financial costs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage financial costs" ON public.financial_costs TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: financial_partners Admins can manage financial partners; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage financial partners" ON public.financial_partners TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: financial_settings Admins can manage financial settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage financial settings" ON public.financial_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: integrations Admins can manage integrations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage integrations" ON public.integrations TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: live_classes Admins can manage live_classes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage live_classes" ON public.live_classes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ebook_modules Admins can manage modules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage modules" ON public.ebook_modules TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notifications Admins can manage notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage notifications" ON public.notifications TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: payout_requests Admins can manage payout requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage payout requests" ON public.payout_requests TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: recipes Admins can manage recipes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage recipes" ON public.recipes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: report_recipients Admins can manage report recipients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage report recipients" ON public.report_recipients TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: report_settings Admins can manage report settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage report settings" ON public.report_settings TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: asaas_transfers Admins can manage transfers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage transfers" ON public.asaas_transfers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_instances Admins can manage whatsapp instances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage whatsapp instances" ON public.whatsapp_instances TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_settings Admins can select email settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can select email settings" ON public.email_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Admins can update any ticket; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update any ticket" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_settings Admins can update email settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update email settings" ON public.email_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_logs Admins can view all logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all logs" ON public.system_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can view all messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all messages" ON public.support_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_logs Admins can view email logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: integration_logs Admins can view integration logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view integration logs" ON public.integration_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: report_logs Admins can view report logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view report logs" ON public.report_logs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: asaas_webhook_events Admins can view webhook logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view webhook logs" ON public.asaas_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins delete leads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins manage all roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage all roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: knowledge_base Admins manage knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage knowledge" ON public.knowledge_base TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: affiliate_links Admins view affiliate links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view affiliate links" ON public.affiliate_links FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins view all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins view leads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: unhandled_questions Admins view/update unhandled; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view/update unhandled" ON public.unhandled_questions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: affiliate_links Affiliates can manage their own links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Affiliates can manage their own links" ON public.affiliate_links TO authenticated USING ((affiliate_id = auth.uid()));


--
-- Name: affiliate_materials Affiliates can view materials; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Affiliates can view materials" ON public.affiliate_materials FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.affiliates
  WHERE ((affiliates.id = auth.uid()) AND (affiliates.status = 'active'::public.affiliate_status)))));


--
-- Name: affiliate_sales Affiliates can view their own sales; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Affiliates can view their own sales" ON public.affiliate_sales FOR SELECT TO authenticated USING ((affiliate_id = auth.uid()));


--
-- Name: knowledge_base Anyone can read active knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read active knowledge" ON public.knowledge_base FOR SELECT TO authenticated, anon USING ((status = 'active'::text));


--
-- Name: leads Anyone can submit a lead; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO authenticated, anon WITH CHECK (((email IS NOT NULL) AND ((length(email) >= 5) AND (length(email) <= 320)) AND (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text) AND ((name IS NULL) OR ((length(name) >= 1) AND (length(name) <= 120))) AND ((phone IS NULL) OR ((length(phone) >= 8) AND (length(phone) <= 25))) AND ((source IS NULL) OR (source = ANY (ARRAY['landing'::text, 'popup'::text, 'checkout'::text, 'chatbot'::text, 'app'::text, 'import'::text])))));


--
-- Name: courses Courses are viewable by authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Courses are viewable by authenticated users" ON public.courses FOR SELECT TO authenticated USING (true);


--
-- Name: live_classes Enrolled students and staff can view live_classes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enrolled students and staff can view live_classes" ON public.live_classes FOR SELECT TO authenticated USING ((public.has_any_enrollment(auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'agent'::public.app_role)));


--
-- Name: course_modules Enrolled users view course modules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enrolled users view course modules" ON public.course_modules FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.course_enrollments e
  WHERE ((e.course_id = course_modules.course_id) AND (e.user_id = auth.uid())))));


--
-- Name: courses Everyone can view course catalog; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Everyone can view course catalog" ON public.courses FOR SELECT TO authenticated USING (true);


--
-- Name: live_classes Manage live classes staff only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Manage live classes staff only" ON public.live_classes TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: partner_balances Partners can see their own balance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Partners can see their own balance" ON public.partner_balances FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: course_feedback Public can view approved feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can view approved feedback" ON public.course_feedback FOR SELECT TO anon USING ((status = 'approved'::text));


--
-- Name: recipes Recipes are viewable by all authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Recipes are viewable by all authenticated users" ON public.recipes FOR SELECT TO authenticated USING (true);


--
-- Name: user_stats Staff can view all stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff can view all stats" ON public.user_stats FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role]))))));


--
-- Name: course_lessons Staff can view course lessons; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff can view course lessons" ON public.course_lessons FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role]))))));


--
-- Name: course_modules Staff can view course modules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff can view course modules" ON public.course_modules FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role]))))));


--
-- Name: course_modules Staff manage course modules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff manage course modules" ON public.course_modules TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role]))))));


--
-- Name: payout_requests Users can create their own payout requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own payout requests" ON public.payout_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_messages Users can insert messages to own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert messages to own tickets" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (((sender_type = 'student'::public.support_sender_type) AND (EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid()))))));


--
-- Name: support_messages Users can insert messages to their tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert messages to their tickets" ON public.support_messages FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: knowledge_feedback Users can insert own feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own feedback" ON public.knowledge_feedback FOR INSERT TO authenticated, anon WITH CHECK ((((user_id IS NULL) OR (user_id = auth.uid())) AND (knowledge_id IS NOT NULL)));


--
-- Name: lesson_progress Users can insert own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can insert own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: unhandled_questions Users can insert own unhandled questions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own unhandled questions" ON public.unhandled_questions FOR INSERT TO authenticated, anon WITH CHECK ((((user_id IS NULL) OR (user_id = auth.uid())) AND (question IS NOT NULL) AND ((length(question) >= 1) AND (length(question) <= 2000)) AND ((context IS NULL) OR (length((context)::text) <= 4000))));


--
-- Name: course_feedback Users can insert their own feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own feedback" ON public.course_feedback FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND ((status IS NULL) OR (status = 'pending'::text)) AND (admin_reply IS NULL)));


--
-- Name: progress_tracking Users can insert their own tracking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own tracking" ON public.progress_tracking FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: ebook_progress Users can manage own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage own progress" ON public.ebook_progress TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_notifications Users can manage their own notification status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own notification status" ON public.user_notifications TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_onboarding Users can manage their own onboarding state; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own onboarding state" ON public.user_onboarding TO authenticated USING ((auth.uid() = user_id));


--
-- Name: pending_checkouts Users can manage their own pending checkouts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own pending checkouts" ON public.pending_checkouts TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: lesson_progress Users can read own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own progress" ON public.lesson_progress FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: affiliates Users can register as affiliates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can register as affiliates" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (((id = auth.uid()) AND (status = 'pending'::public.affiliate_status) AND (balance = (0)::numeric) AND (total_earnings = (0)::numeric) AND (commission_rate = (30)::numeric) AND (referrer_id IS NULL)));


--
-- Name: payout_requests Users can see their own payouts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see their own payouts" ON public.payout_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: lesson_progress Users can update own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own progress" ON public.lesson_progress FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can update own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: affiliates Users can update their own affiliate profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own affiliate profile" ON public.affiliates FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK (((auth.uid() = id) AND public.affiliate_sensitive_fields_unchanged(id, status, commission_rate, balance, total_earnings, referrer_id)));


--
-- Name: user_notifications Users can update their own notification status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notification status" ON public.user_notifications TO authenticated USING ((auth.uid() = user_id));


--
-- Name: lesson_progress Users can update their own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own progress" ON public.lesson_progress TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: progress_tracking Users can update their own tracking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own tracking" ON public.progress_tracking FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: certificate_templates Users can view active templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view active templates" ON public.certificate_templates FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: course_feedback Users can view approved feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view approved feedback" ON public.course_feedback FOR SELECT TO authenticated USING (((status = 'approved'::text) OR (auth.uid() = user_id)));


--
-- Name: ebook_chapters Users can view chapters of enrolled ebooks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view chapters of enrolled ebooks" ON public.ebook_chapters FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.ebook_enrollments e
  WHERE ((e.ebook_id = ebook_chapters.ebook_id) AND (e.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role])))))));


--
-- Name: content_certificates Users can view content certificates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view content certificates" ON public.content_certificates FOR SELECT TO authenticated USING (true);


--
-- Name: courses Users can view courses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view courses" ON public.courses FOR SELECT TO authenticated USING (true);


--
-- Name: ebooks Users can view ebooks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view ebooks" ON public.ebooks FOR SELECT TO authenticated USING (true);


--
-- Name: course_lessons Users can view lessons of enrolled courses or free lessons; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view lessons of enrolled courses or free lessons" ON public.course_lessons FOR SELECT TO authenticated USING (((is_free = true) OR (EXISTS ( SELECT 1
   FROM (public.course_modules m
     JOIN public.course_enrollments e ON ((e.course_id = m.course_id)))
  WHERE ((m.id = course_lessons.module_id) AND (e.user_id = auth.uid()))))));


--
-- Name: support_messages Users can view messages of own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view messages of own tickets" ON public.support_messages FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: support_messages Users can view messages of their tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view messages of their tickets" ON public.support_messages FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: ebook_modules Users can view modules of enrolled ebooks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view modules of enrolled ebooks" ON public.ebook_modules FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.ebook_enrollments e
  WHERE ((e.ebook_id = ebook_modules.ebook_id) AND (e.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'manager'::public.app_role, 'agent'::public.app_role])))))));


--
-- Name: course_enrollments Users can view own enrollment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own enrollment" ON public.course_enrollments FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: ebook_enrollments Users can view own enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own enrollments" ON public.ebook_enrollments FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: lesson_progress Users can view own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own progress" ON public.lesson_progress FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: affiliates Users can view their own affiliate profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own affiliate profile" ON public.affiliates FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: certificates Users can view their own certificates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own certificates" ON public.certificates FOR SELECT TO authenticated USING (((auth.uid() = student_id) AND (is_revoked = false)));


--
-- Name: course_enrollments Users can view their own course enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own course enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: affiliate_custom_commissions Users can view their own custom commissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own custom commissions" ON public.affiliate_custom_commissions FOR SELECT TO authenticated USING ((affiliate_id = auth.uid()));


--
-- Name: user_notifications Users can view their own notification status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notification status" ON public.user_notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: partner_balances Users can view their own partner balance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own partner balance" ON public.partner_balances FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: payout_requests Users can view their own payout requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own payout requests" ON public.payout_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: lesson_progress Users can view their own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own progress" ON public.lesson_progress FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_stats Users can view their own stats; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: progress_tracking Users can view their own tracking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own tracking" ON public.progress_tracking FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users see their own roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users see their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: notifications Users view own or global notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users view own or global notifications" ON public.notifications FOR SELECT TO authenticated USING (((target_type = 'all'::text) OR (EXISTS ( SELECT 1
   FROM public.user_notifications un
  WHERE ((un.notification_id = notifications.id) AND (un.user_id = auth.uid()))))));


--
-- Name: payments Users view own payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: live_classes View live classes restricted; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "View live classes restricted" ON public.live_classes FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'agent'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.course_enrollments
  WHERE (course_enrollments.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.ebook_enrollments
  WHERE (ebook_enrollments.user_id = auth.uid())))));


--
-- Name: platform_materials admin_all_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_access ON public.platform_materials TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_custom_commissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.affiliate_custom_commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_materials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.affiliate_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_sales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_transfers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_webhook_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_winners; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.campaign_winners ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_winners campaign_winners_admin_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY campaign_winners_admin_policy ON public.campaign_winners TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: campaign_winners campaign_winners_self_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY campaign_winners_self_read ON public.campaign_winners FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: certificate_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: certificates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: content_certificates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.content_certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: course_enrollments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: course_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: course_lessons; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: course_modules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_chapters; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_enrollments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ebook_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_modules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ebook_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: ebook_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ebook_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: ebooks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

--
-- Name: email_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: email_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_templates_config ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_costs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_costs ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_partners; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_partners ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: integrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_base; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: live_classes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_balances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.partner_balances ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: payout_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_checkouts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pending_checkouts ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_materials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.platform_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: progress_tracking; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: ranking_campaigns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ranking_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: ranking_campaigns ranking_campaigns_admin_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ranking_campaigns_admin_policy ON public.ranking_campaigns TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ranking_campaigns ranking_campaigns_read_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ranking_campaigns_read_policy ON public.ranking_campaigns FOR SELECT TO authenticated USING (true);


--
-- Name: recipes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

--
-- Name: report_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: report_recipients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;

--
-- Name: report_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_materials student_read_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY student_read_access ON public.platform_materials FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: system_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: unhandled_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.unhandled_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: user_onboarding; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_instances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO sandbox_exec;


--
-- Name: FUNCTION acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb) TO service_role;


--
-- Name: FUNCTION acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb, p_lease_interval interval); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb, p_lease_interval interval) FROM PUBLIC;
GRANT ALL ON FUNCTION public.acquire_asaas_webhook_claim(p_event_id text, p_payment_id text, p_event_type text, p_payload jsonb, p_lease_interval interval) TO service_role;


--
-- Name: FUNCTION affiliate_sensitive_fields_unchanged(_id uuid, _status public.affiliate_status, _commission_rate numeric, _balance numeric, _total_earnings numeric, _referrer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.affiliate_sensitive_fields_unchanged(_id uuid, _status public.affiliate_status, _commission_rate numeric, _balance numeric, _total_earnings numeric, _referrer_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.affiliate_sensitive_fields_unchanged(_id uuid, _status public.affiliate_status, _commission_rate numeric, _balance numeric, _total_earnings numeric, _referrer_id uuid) TO service_role;


--
-- Name: FUNCTION award_points(p_user_id uuid, p_points integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.award_points(p_user_id uuid, p_points integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.award_points(p_user_id uuid, p_points integer) TO service_role;


--
-- Name: FUNCTION check_progress_milestones(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.check_progress_milestones() FROM PUBLIC;
GRANT ALL ON FUNCTION public.check_progress_milestones() TO service_role;


--
-- Name: FUNCTION complete_linked_course(_ebook_id text, _user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.complete_linked_course(_ebook_id text, _user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_linked_course(_ebook_id text, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.complete_linked_course(_ebook_id text, _user_id uuid) TO service_role;


--
-- Name: FUNCTION distribute_partner_profits(p_amount numeric, p_partner_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.distribute_partner_profits(p_amount numeric, p_partner_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.distribute_partner_profits(p_amount numeric, p_partner_id uuid) TO service_role;


--
-- Name: FUNCTION enforce_affiliate_field_restrictions(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_affiliate_field_restrictions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_affiliate_field_restrictions() TO service_role;


--
-- Name: FUNCTION enforce_support_ticket_field_restrictions(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_support_ticket_field_restrictions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_support_ticket_field_restrictions() TO service_role;


--
-- Name: FUNCTION finish_ranking_campaign(_campaign_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.finish_ranking_campaign(_campaign_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.finish_ranking_campaign(_campaign_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.finish_ranking_campaign(_campaign_id uuid) TO authenticated;


--
-- Name: FUNCTION get_student_ranking(p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.get_student_ranking(p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_student_ranking(p_limit integer) TO service_role;
GRANT ALL ON FUNCTION public.get_student_ranking(p_limit integer) TO authenticated;


--
-- Name: FUNCTION get_student_ranking_v2(p_limit integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.get_student_ranking_v2(p_limit integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_student_ranking_v2(p_limit integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.get_student_ranking_v2(p_limit integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO service_role;


--
-- Name: FUNCTION handle_item_completion(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.handle_item_completion() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_item_completion() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_any_enrollment(_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.has_any_enrollment(_user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_any_enrollment(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_any_enrollment(_user_id uuid) TO service_role;


--
-- Name: FUNCTION has_module_access(_user_id uuid, _module text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.has_module_access(_user_id uuid, _module text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_module_access(_user_id uuid, _module text) TO service_role;


--
-- Name: FUNCTION has_role(_user_id uuid, _role public.app_role); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;


--
-- Name: FUNCTION increment_affiliate_earnings(aff_id uuid, amount_to_add numeric); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.increment_affiliate_earnings(aff_id uuid, amount_to_add numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.increment_affiliate_earnings(aff_id uuid, amount_to_add numeric) TO service_role;


--
-- Name: FUNCTION increment_partner_withdrawn(p_user_id uuid, p_amount numeric); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.increment_partner_withdrawn(p_user_id uuid, p_amount numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.increment_partner_withdrawn(p_user_id uuid, p_amount numeric) TO service_role;


--
-- Name: FUNCTION log_system_event(_level text, _source text, _message text, _details jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.log_system_event(_level text, _source text, _message text, _details jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_system_event(_level text, _source text, _message text, _details jsonb) TO service_role;
GRANT ALL ON FUNCTION public.log_system_event(_level text, _source text, _message text, _details jsonb) TO authenticated;


--
-- Name: FUNCTION log_unhandled_question_v2(p_message text, p_confidence double precision, p_context jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.log_unhandled_question_v2(p_message text, p_confidence double precision, p_context jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_unhandled_question_v2(p_message text, p_confidence double precision, p_context jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.log_unhandled_question_v2(p_message text, p_confidence double precision, p_context jsonb) TO service_role;


--
-- Name: FUNCTION notify_new_feedback(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.notify_new_feedback() FROM PUBLIC;
GRANT ALL ON FUNCTION public.notify_new_feedback() TO service_role;


--
-- Name: FUNCTION promote_to_student(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.promote_to_student() FROM PUBLIC;
GRANT ALL ON FUNCTION public.promote_to_student() TO service_role;


--
-- Name: FUNCTION protect_profile_privileged_fields(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.protect_profile_privileged_fields() FROM PUBLIC;
GRANT ALL ON FUNCTION public.protect_profile_privileged_fields() TO service_role;


--
-- Name: FUNCTION protect_support_ticket_staff_fields(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.protect_support_ticket_staff_fields() FROM PUBLIC;
GRANT ALL ON FUNCTION public.protect_support_ticket_staff_fields() TO service_role;


--
-- Name: FUNCTION save_assistant_response(p_ticket_id uuid, p_content text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.save_assistant_response(p_ticket_id uuid, p_content text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_assistant_response(p_ticket_id uuid, p_content text) TO service_role;


--
-- Name: FUNCTION sync_report_cron(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.sync_report_cron() FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_report_cron() TO service_role;


--
-- Name: FUNCTION update_expired_live_classes(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_expired_live_classes() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_expired_live_classes() TO service_role;


--
-- Name: FUNCTION update_payout_requests_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_payout_requests_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_payout_requests_updated_at() TO service_role;


--
-- Name: FUNCTION update_ticket_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_ticket_timestamp() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: TABLE admin_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_permissions TO anon;
GRANT ALL ON TABLE public.admin_permissions TO authenticated;
GRANT ALL ON TABLE public.admin_permissions TO service_role;
GRANT SELECT,INSERT ON TABLE public.admin_permissions TO sandbox_exec;


--
-- Name: TABLE affiliate_custom_commissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.affiliate_custom_commissions TO anon;
GRANT ALL ON TABLE public.affiliate_custom_commissions TO authenticated;
GRANT ALL ON TABLE public.affiliate_custom_commissions TO service_role;
GRANT SELECT,INSERT ON TABLE public.affiliate_custom_commissions TO sandbox_exec;


--
-- Name: TABLE affiliate_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.affiliate_links TO anon;
GRANT ALL ON TABLE public.affiliate_links TO authenticated;
GRANT ALL ON TABLE public.affiliate_links TO service_role;
GRANT SELECT,INSERT ON TABLE public.affiliate_links TO sandbox_exec;


--
-- Name: TABLE affiliate_materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.affiliate_materials TO anon;
GRANT ALL ON TABLE public.affiliate_materials TO authenticated;
GRANT ALL ON TABLE public.affiliate_materials TO service_role;
GRANT SELECT,INSERT ON TABLE public.affiliate_materials TO sandbox_exec;


--
-- Name: TABLE affiliate_sales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.affiliate_sales TO anon;
GRANT ALL ON TABLE public.affiliate_sales TO authenticated;
GRANT ALL ON TABLE public.affiliate_sales TO service_role;
GRANT SELECT,INSERT ON TABLE public.affiliate_sales TO sandbox_exec;


--
-- Name: TABLE affiliates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.affiliates TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.affiliates TO authenticated;
GRANT ALL ON TABLE public.affiliates TO service_role;
GRANT SELECT,INSERT ON TABLE public.affiliates TO sandbox_exec;


--
-- Name: COLUMN affiliates.pix_key; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(pix_key) ON TABLE public.affiliates TO authenticated;


--
-- Name: COLUMN affiliates.bank_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(bank_info) ON TABLE public.affiliates TO authenticated;


--
-- Name: COLUMN affiliates.updated_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(updated_at) ON TABLE public.affiliates TO authenticated;


--
-- Name: TABLE asaas_transfers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.asaas_transfers TO anon;
GRANT ALL ON TABLE public.asaas_transfers TO authenticated;
GRANT ALL ON TABLE public.asaas_transfers TO service_role;
GRANT SELECT,INSERT ON TABLE public.asaas_transfers TO sandbox_exec;


--
-- Name: TABLE asaas_webhook_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.asaas_webhook_events TO anon;
GRANT ALL ON TABLE public.asaas_webhook_events TO authenticated;
GRANT ALL ON TABLE public.asaas_webhook_events TO service_role;
GRANT SELECT,INSERT ON TABLE public.asaas_webhook_events TO sandbox_exec;


--
-- Name: TABLE campaign_winners; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.campaign_winners TO anon;
GRANT ALL ON TABLE public.campaign_winners TO authenticated;
GRANT ALL ON TABLE public.campaign_winners TO service_role;
GRANT SELECT,INSERT ON TABLE public.campaign_winners TO sandbox_exec;


--
-- Name: TABLE certificate_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.certificate_templates TO anon;
GRANT ALL ON TABLE public.certificate_templates TO authenticated;
GRANT ALL ON TABLE public.certificate_templates TO service_role;
GRANT SELECT,INSERT ON TABLE public.certificate_templates TO sandbox_exec;


--
-- Name: TABLE certificates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.certificates TO anon;
GRANT ALL ON TABLE public.certificates TO authenticated;
GRANT ALL ON TABLE public.certificates TO service_role;
GRANT SELECT,INSERT ON TABLE public.certificates TO sandbox_exec;


--
-- Name: TABLE content_certificates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.content_certificates TO anon;
GRANT ALL ON TABLE public.content_certificates TO authenticated;
GRANT ALL ON TABLE public.content_certificates TO service_role;
GRANT SELECT,INSERT ON TABLE public.content_certificates TO sandbox_exec;


--
-- Name: TABLE course_enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_enrollments TO anon;
GRANT ALL ON TABLE public.course_enrollments TO authenticated;
GRANT ALL ON TABLE public.course_enrollments TO service_role;
GRANT SELECT,INSERT ON TABLE public.course_enrollments TO sandbox_exec;


--
-- Name: TABLE course_feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.course_feedback TO anon;
GRANT ALL ON TABLE public.course_feedback TO authenticated;
GRANT ALL ON TABLE public.course_feedback TO service_role;
GRANT SELECT,INSERT ON TABLE public.course_feedback TO sandbox_exec;


--
-- Name: COLUMN course_feedback.id; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(id) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.course_id; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(course_id) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.rating; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(rating) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.comment; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(comment) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.status; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(status) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.created_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(created_at) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.updated_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(updated_at) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.admin_reply; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(admin_reply) ON TABLE public.course_feedback TO anon;


--
-- Name: COLUMN course_feedback.ebook_id; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(ebook_id) ON TABLE public.course_feedback TO anon;


--
-- Name: TABLE course_lessons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_lessons TO anon;
GRANT ALL ON TABLE public.course_lessons TO authenticated;
GRANT ALL ON TABLE public.course_lessons TO service_role;
GRANT SELECT,INSERT ON TABLE public.course_lessons TO sandbox_exec;


--
-- Name: TABLE course_modules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_modules TO anon;
GRANT ALL ON TABLE public.course_modules TO authenticated;
GRANT ALL ON TABLE public.course_modules TO service_role;
GRANT SELECT,INSERT ON TABLE public.course_modules TO sandbox_exec;


--
-- Name: TABLE courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.courses TO anon;
GRANT ALL ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;
GRANT SELECT,INSERT ON TABLE public.courses TO sandbox_exec;


--
-- Name: TABLE ebook_chapters; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ebook_chapters TO anon;
GRANT ALL ON TABLE public.ebook_chapters TO authenticated;
GRANT ALL ON TABLE public.ebook_chapters TO service_role;
GRANT SELECT,INSERT ON TABLE public.ebook_chapters TO sandbox_exec;


--
-- Name: TABLE ebook_enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ebook_enrollments TO anon;
GRANT ALL ON TABLE public.ebook_enrollments TO authenticated;
GRANT ALL ON TABLE public.ebook_enrollments TO service_role;
GRANT SELECT,INSERT ON TABLE public.ebook_enrollments TO sandbox_exec;


--
-- Name: TABLE ebook_modules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ebook_modules TO anon;
GRANT ALL ON TABLE public.ebook_modules TO authenticated;
GRANT ALL ON TABLE public.ebook_modules TO service_role;
GRANT SELECT,INSERT ON TABLE public.ebook_modules TO sandbox_exec;


--
-- Name: TABLE ebook_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ebook_progress TO anon;
GRANT ALL ON TABLE public.ebook_progress TO authenticated;
GRANT ALL ON TABLE public.ebook_progress TO service_role;
GRANT SELECT,INSERT ON TABLE public.ebook_progress TO sandbox_exec;


--
-- Name: TABLE ebooks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ebooks TO anon;
GRANT ALL ON TABLE public.ebooks TO authenticated;
GRANT ALL ON TABLE public.ebooks TO service_role;
GRANT SELECT,INSERT ON TABLE public.ebooks TO sandbox_exec;


--
-- Name: TABLE email_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_logs TO anon;
GRANT ALL ON TABLE public.email_logs TO authenticated;
GRANT ALL ON TABLE public.email_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_logs TO sandbox_exec;


--
-- Name: TABLE email_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_settings TO anon;
GRANT ALL ON TABLE public.email_settings TO authenticated;
GRANT ALL ON TABLE public.email_settings TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_settings TO sandbox_exec;


--
-- Name: TABLE email_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_templates TO anon;
GRANT ALL ON TABLE public.email_templates TO authenticated;
GRANT ALL ON TABLE public.email_templates TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_templates TO sandbox_exec;


--
-- Name: TABLE email_templates_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_templates_config TO anon;
GRANT ALL ON TABLE public.email_templates_config TO authenticated;
GRANT ALL ON TABLE public.email_templates_config TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_templates_config TO sandbox_exec;


--
-- Name: TABLE financial_costs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_costs TO anon;
GRANT ALL ON TABLE public.financial_costs TO authenticated;
GRANT ALL ON TABLE public.financial_costs TO service_role;
GRANT SELECT,INSERT ON TABLE public.financial_costs TO sandbox_exec;


--
-- Name: TABLE financial_partners; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_partners TO anon;
GRANT ALL ON TABLE public.financial_partners TO authenticated;
GRANT ALL ON TABLE public.financial_partners TO service_role;
GRANT SELECT,INSERT ON TABLE public.financial_partners TO sandbox_exec;


--
-- Name: TABLE financial_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_settings TO anon;
GRANT ALL ON TABLE public.financial_settings TO authenticated;
GRANT ALL ON TABLE public.financial_settings TO service_role;
GRANT SELECT,INSERT ON TABLE public.financial_settings TO sandbox_exec;


--
-- Name: TABLE integration_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integration_logs TO anon;
GRANT ALL ON TABLE public.integration_logs TO authenticated;
GRANT ALL ON TABLE public.integration_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.integration_logs TO sandbox_exec;


--
-- Name: TABLE integrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integrations TO anon;
GRANT ALL ON TABLE public.integrations TO authenticated;
GRANT ALL ON TABLE public.integrations TO service_role;
GRANT SELECT,INSERT ON TABLE public.integrations TO sandbox_exec;


--
-- Name: TABLE knowledge_base; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_base TO anon;
GRANT ALL ON TABLE public.knowledge_base TO authenticated;
GRANT ALL ON TABLE public.knowledge_base TO service_role;
GRANT SELECT,INSERT ON TABLE public.knowledge_base TO sandbox_exec;


--
-- Name: TABLE knowledge_feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.knowledge_feedback TO anon;
GRANT ALL ON TABLE public.knowledge_feedback TO authenticated;
GRANT ALL ON TABLE public.knowledge_feedback TO service_role;
GRANT SELECT,INSERT ON TABLE public.knowledge_feedback TO sandbox_exec;


--
-- Name: TABLE leads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leads TO anon;
GRANT ALL ON TABLE public.leads TO authenticated;
GRANT ALL ON TABLE public.leads TO service_role;
GRANT SELECT,INSERT ON TABLE public.leads TO sandbox_exec;


--
-- Name: TABLE lesson_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lesson_progress TO anon;
GRANT ALL ON TABLE public.lesson_progress TO authenticated;
GRANT ALL ON TABLE public.lesson_progress TO service_role;
GRANT SELECT,INSERT ON TABLE public.lesson_progress TO sandbox_exec;


--
-- Name: TABLE live_classes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.live_classes TO anon;
GRANT ALL ON TABLE public.live_classes TO authenticated;
GRANT ALL ON TABLE public.live_classes TO service_role;
GRANT SELECT,INSERT ON TABLE public.live_classes TO sandbox_exec;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT,INSERT ON TABLE public.notifications TO sandbox_exec;


--
-- Name: TABLE partner_balances; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.partner_balances TO anon;
GRANT ALL ON TABLE public.partner_balances TO authenticated;
GRANT ALL ON TABLE public.partner_balances TO service_role;
GRANT SELECT,INSERT ON TABLE public.partner_balances TO sandbox_exec;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;
GRANT SELECT,INSERT ON TABLE public.payments TO sandbox_exec;


--
-- Name: TABLE payout_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payout_requests TO anon;
GRANT ALL ON TABLE public.payout_requests TO authenticated;
GRANT ALL ON TABLE public.payout_requests TO service_role;
GRANT SELECT,INSERT ON TABLE public.payout_requests TO sandbox_exec;


--
-- Name: TABLE pending_checkouts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pending_checkouts TO anon;
GRANT ALL ON TABLE public.pending_checkouts TO authenticated;
GRANT ALL ON TABLE public.pending_checkouts TO service_role;
GRANT SELECT,INSERT ON TABLE public.pending_checkouts TO sandbox_exec;


--
-- Name: TABLE platform_materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.platform_materials TO anon;
GRANT ALL ON TABLE public.platform_materials TO authenticated;
GRANT ALL ON TABLE public.platform_materials TO service_role;
GRANT SELECT,INSERT ON TABLE public.platform_materials TO sandbox_exec;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT,INSERT ON TABLE public.profiles TO sandbox_exec;


--
-- Name: TABLE progress_tracking; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.progress_tracking TO anon;
GRANT ALL ON TABLE public.progress_tracking TO authenticated;
GRANT ALL ON TABLE public.progress_tracking TO service_role;
GRANT SELECT,INSERT ON TABLE public.progress_tracking TO sandbox_exec;


--
-- Name: TABLE ranking_campaigns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ranking_campaigns TO anon;
GRANT ALL ON TABLE public.ranking_campaigns TO authenticated;
GRANT ALL ON TABLE public.ranking_campaigns TO service_role;
GRANT SELECT,INSERT ON TABLE public.ranking_campaigns TO sandbox_exec;


--
-- Name: TABLE recipes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.recipes TO anon;
GRANT ALL ON TABLE public.recipes TO authenticated;
GRANT ALL ON TABLE public.recipes TO service_role;
GRANT SELECT,INSERT ON TABLE public.recipes TO sandbox_exec;


--
-- Name: TABLE report_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.report_logs TO anon;
GRANT ALL ON TABLE public.report_logs TO authenticated;
GRANT ALL ON TABLE public.report_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.report_logs TO sandbox_exec;


--
-- Name: TABLE report_recipients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.report_recipients TO anon;
GRANT ALL ON TABLE public.report_recipients TO authenticated;
GRANT ALL ON TABLE public.report_recipients TO service_role;
GRANT SELECT,INSERT ON TABLE public.report_recipients TO sandbox_exec;


--
-- Name: TABLE report_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.report_settings TO anon;
GRANT ALL ON TABLE public.report_settings TO authenticated;
GRANT ALL ON TABLE public.report_settings TO service_role;
GRANT SELECT,INSERT ON TABLE public.report_settings TO sandbox_exec;


--
-- Name: TABLE support_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_messages TO anon;
GRANT ALL ON TABLE public.support_messages TO authenticated;
GRANT ALL ON TABLE public.support_messages TO service_role;
GRANT SELECT,INSERT ON TABLE public.support_messages TO sandbox_exec;


--
-- Name: TABLE support_tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_tickets TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.support_tickets TO authenticated;
GRANT ALL ON TABLE public.support_tickets TO service_role;
GRANT SELECT,INSERT ON TABLE public.support_tickets TO sandbox_exec;


--
-- Name: TABLE system_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_logs TO anon;
GRANT ALL ON TABLE public.system_logs TO authenticated;
GRANT ALL ON TABLE public.system_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.system_logs TO sandbox_exec;


--
-- Name: TABLE unhandled_questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.unhandled_questions TO anon;
GRANT ALL ON TABLE public.unhandled_questions TO authenticated;
GRANT ALL ON TABLE public.unhandled_questions TO service_role;
GRANT SELECT,INSERT ON TABLE public.unhandled_questions TO sandbox_exec;


--
-- Name: TABLE user_notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_notifications TO anon;
GRANT ALL ON TABLE public.user_notifications TO authenticated;
GRANT ALL ON TABLE public.user_notifications TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_notifications TO sandbox_exec;


--
-- Name: TABLE user_onboarding; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_onboarding TO anon;
GRANT ALL ON TABLE public.user_onboarding TO authenticated;
GRANT ALL ON TABLE public.user_onboarding TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_onboarding TO sandbox_exec;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_roles TO sandbox_exec;


--
-- Name: TABLE user_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_stats TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.user_stats TO authenticated;
GRANT ALL ON TABLE public.user_stats TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_stats TO sandbox_exec;


--
-- Name: TABLE whatsapp_instances; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.whatsapp_instances TO anon;
GRANT ALL ON TABLE public.whatsapp_instances TO authenticated;
GRANT ALL ON TABLE public.whatsapp_instances TO service_role;
GRANT SELECT,INSERT ON TABLE public.whatsapp_instances TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT ON TABLES TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict EYGCue1AzKec0F4cBfQOB2ifsvtlsmeTG9FmaPgbchkbtQEIRRXtvMOqSDqXlKs

-- Storage Buckets Setup
 INSERT INTO storage.buckets (id, name, public) VALUES ('content-covers', 'content-covers', 'f') ON CONFLICT (id) DO NOTHING;
 INSERT INTO storage.buckets (id, name, public) VALUES ('course-assets', 'course-assets', 'f') ON CONFLICT (id) DO NOTHING;
 INSERT INTO storage.buckets (id, name, public) VALUES ('platform-materials', 'platform-materials', 'f') ON CONFLICT (id) DO NOTHING;
 INSERT INTO storage.buckets (id, name, public) VALUES ('ebook-assets', 'ebook-assets', 'f') ON CONFLICT (id) DO NOTHING;
 INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', 'f') ON CONFLICT (id) DO NOTHING;


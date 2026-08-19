-- 1. Restringir log_system_event (assinatura correta: text, text, text, jsonb)
REVOKE ALL ON FUNCTION public.log_system_event(text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_system_event(text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_system_event(text, text, text, jsonb) TO authenticated, service_role;

-- 2. Restringir log_unhandled_question_v2 (assinatura correta: text, float8, jsonb)
REVOKE ALL ON FUNCTION public.log_unhandled_question_v2(text, float8, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_unhandled_question_v2(text, float8, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_unhandled_question_v2(text, float8, jsonb) TO authenticated, service_role;

-- 3. Confirmar proteção do ranking v2
ALTER FUNCTION public.get_student_ranking_v2(integer, timestamptz, timestamptz) SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.get_student_ranking_v2(integer, timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_student_ranking_v2(integer, timestamptz, timestamptz) TO authenticated, service_role;

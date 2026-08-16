-- Mover funções SECURITY DEFINER sensíveis para um esquema privado
CREATE SCHEMA IF NOT EXISTS private;

-- 1. has_role
ALTER FUNCTION public.has_role(uuid, app_role) SET SCHEMA private;
-- 2. get_student_ranking
ALTER FUNCTION public.get_student_ranking(integer) SET SCHEMA private;
-- 3. award_points
ALTER FUNCTION public.award_points(uuid, integer) SET SCHEMA private;
-- 4. save_assistant_response
ALTER FUNCTION public.save_assistant_response(uuid, text) SET SCHEMA private;
-- 5. affiliate_sensitive_fields_unchanged
ALTER FUNCTION public.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) SET SCHEMA private;

-- Recriar wrappers SECURITY INVOKER no public se necessário
-- has_role é usada em RLS, então vamos garantir que o search_path inclua private ou chamá-la explicitamente
-- As RLS precisarão ser atualizadas ou a função deve ser acessível.
-- Para TanStack Start, o melhor é mover para private e chamar via RPC se for o caso, 
-- mas RLS requer acesso direto.
-- Vamos tentar apenas revogar o EXECUTE de authenticated e deixar apenas service_role onde for possível.

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION private.get_student_ranking(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.get_student_ranking(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION private.award_points(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.award_points(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION private.save_assistant_response(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.save_assistant_response(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION private.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) TO service_role;

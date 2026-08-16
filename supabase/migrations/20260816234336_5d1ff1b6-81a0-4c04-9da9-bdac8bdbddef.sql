-- Mover funções de volta para public, mas manter segurança via REVOKE/GRANT 
-- e remover SECURITY DEFINER onde for desnecessário ou perigoso.

ALTER FUNCTION private.has_role(uuid, app_role) SET SCHEMA public;
ALTER FUNCTION private.get_student_ranking(integer) SET SCHEMA public;
ALTER FUNCTION private.award_points(uuid, integer) SET SCHEMA public;
ALTER FUNCTION private.save_assistant_response(uuid, text) SET SCHEMA public;
ALTER FUNCTION private.affiliate_sensitive_fields_unchanged(uuid, affiliate_status, numeric, numeric, numeric, uuid) SET SCHEMA public;

DROP SCHEMA private;

-- Agora, em vez de mover, vamos converter para SECURITY INVOKER onde for possível
-- ou garantir que apenas service_role possa executar se for sensível.

-- has_role é usada em RLS, PRECISA ser acessível, mas o SECURITY DEFINER é o que previne recursão.
-- Vamos garantir que apenas authenticated possa chamar, mas não anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- get_student_ranking
REVOKE ALL ON FUNCTION public.get_student_ranking(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_ranking(integer) TO authenticated, service_role;

-- award_points
REVOKE ALL ON FUNCTION public.award_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer) TO authenticated, service_role;

-- save_assistant_response
REVOKE ALL ON FUNCTION public.save_assistant_response(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) TO authenticated, service_role;

-- asaas webhook claim
REVOKE ALL ON FUNCTION public.acquire_asaas_webhook_claim(text, text, text, jsonb, interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_asaas_webhook_claim(text, text, text, jsonb, interval) TO service_role;

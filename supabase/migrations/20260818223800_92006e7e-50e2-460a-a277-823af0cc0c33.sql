
-- Corrigir permissões da função finish_ranking_campaign (sinalizada como pública pelo linter)
REVOKE EXECUTE ON FUNCTION public.finish_ranking_campaign(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_ranking_campaign(uuid) TO service_role;

-- Corrigir outras funções que não devem ser acessíveis por usuários autenticados comuns
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_system_event(text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.log_system_event(text, text, text, jsonb) TO service_role;

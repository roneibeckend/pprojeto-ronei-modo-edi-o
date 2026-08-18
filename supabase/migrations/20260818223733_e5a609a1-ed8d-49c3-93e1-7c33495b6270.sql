
-- Restringir execução da função distribute_partner_profits apenas ao service_role
REVOKE EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) TO service_role;

-- Restringir outras funções críticas que foram sinalizadas pelo linter
REVOKE EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) TO service_role;

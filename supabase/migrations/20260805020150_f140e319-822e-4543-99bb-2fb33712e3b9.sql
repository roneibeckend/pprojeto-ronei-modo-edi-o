-- Fix linter warnings by revoking public execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Re-grant to authenticated/service_role only where needed
GRANT EXECUTE ON FUNCTION public.update_ticket_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

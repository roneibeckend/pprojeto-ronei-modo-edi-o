REVOKE EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) TO authenticated, service_role;
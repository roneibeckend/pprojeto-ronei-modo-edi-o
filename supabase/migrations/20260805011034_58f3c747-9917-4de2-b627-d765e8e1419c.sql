-- Fixes based on linter warnings

-- 1. Set search_path for handle_new_user and revoke public execution
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Checking if there are other security definer functions to fix (the linter mentioned multiple)
-- Usually there's one for has_role or similar if it was created by the platform earlier.

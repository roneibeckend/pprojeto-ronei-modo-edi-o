-- Fix search_path and execution permissions for has_role
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;

-- Fix search_path for update_updated_at_column (if it is security definer, which it likely is)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

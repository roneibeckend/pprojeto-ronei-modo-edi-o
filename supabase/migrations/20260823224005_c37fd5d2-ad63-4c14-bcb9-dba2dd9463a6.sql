REVOKE ALL ON FUNCTION public.system_logs_autoprune() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.system_logs_autoprune() FROM anon;
REVOKE ALL ON FUNCTION public.system_logs_autoprune() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.system_logs_autoprune() TO service_role;
REVOKE ALL ON FUNCTION public.prune_system_logs(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prune_system_logs(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION public.prune_system_logs(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.prune_system_logs(integer, interval) TO service_role;
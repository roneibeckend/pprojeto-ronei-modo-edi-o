-- Revogar acesso público às funções SECURITY DEFINER restantes
REVOKE EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_item_completion() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_feedback() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_to_student() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_progress_milestones() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_support_ticket_field_restrictions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_affiliate_field_restrictions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_report_cron() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_expired_live_classes() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) TO service_role;

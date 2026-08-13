REVOKE ALL ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_feedback() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_item_completion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_progress_milestones() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promote_to_student() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_report_cron() FROM PUBLIC, anon, authenticated;
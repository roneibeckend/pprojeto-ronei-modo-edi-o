REVOKE EXECUTE ON FUNCTION public.request_payout_atomic(numeric, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_payout(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_payout_status(uuid, public.payout_status, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_request_payout_document(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_payout_insert_fields() FROM anon;
-- 1. Lock down SECURITY DEFINER functions callable by anon
REVOKE ALL ON FUNCTION public.acquire_asaas_webhook_claim(text, text, text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.complete_linked_course(text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_asaas_webhook_claim(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_linked_course(text, uuid) TO authenticated, service_role;

-- 2. Pin search_path on the remaining mutable function
CREATE OR REPLACE FUNCTION public.increment_partner_withdrawn(p_user_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.partner_balances 
    SET total_withdrawn = total_withdrawn + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) TO service_role;

-- 3. Stop exposing reviewer user_id to anonymous visitors
DROP POLICY IF EXISTS "Public can view approved feedback" ON public.course_feedback;

CREATE OR REPLACE VIEW public.public_course_feedback AS
SELECT
  f.id,
  f.course_id,
  f.ebook_id,
  f.rating,
  f.comment,
  f.admin_reply,
  f.created_at,
  p.name AS reviewer_name,
  p.avatar_url AS reviewer_avatar_url
FROM public.course_feedback f
LEFT JOIN public.profiles p ON p.id = f.user_id
WHERE f.status = 'approved';

GRANT SELECT ON public.public_course_feedback TO anon, authenticated;
-- 1. Payments
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. lessons permissive policy
DROP POLICY IF EXISTS "Lessons are viewable by authenticated users" ON public.lessons;

-- 3. course_modules RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage course modules" ON public.course_modules
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role,'manager'::app_role,'agent'::app_role])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role,'manager'::app_role,'agent'::app_role])));
CREATE POLICY "Enrolled users view course modules" ON public.course_modules
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_enrollments e WHERE e.course_id = course_modules.course_id AND e.user_id = auth.uid()));

-- 4. notifications scoping
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Students can view notifications" ON public.notifications;
CREATE POLICY "Users view own or global notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    target_type = 'all'
    OR EXISTS (SELECT 1 FROM public.user_notifications un WHERE un.notification_id = notifications.id AND un.user_id = auth.uid())
  );

-- 5. affiliate_links public read
DROP POLICY IF EXISTS "Public can view links for tracking" ON public.affiliate_links;
CREATE POLICY "Admins view affiliate links" ON public.affiliate_links
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.affiliate_links FROM anon;

-- 6. integration_logs insert
DROP POLICY IF EXISTS "Authenticated can insert logs" ON public.integration_logs;

-- 7. student_ranking: replace SECURITY DEFINER view with a definer function
DROP VIEW IF EXISTS public.student_ranking;
CREATE OR REPLACE FUNCTION public.get_student_ranking(p_limit integer DEFAULT 50)
RETURNS TABLE (user_id uuid, name text, avatar_url text, total_points integer, global_rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url, us.total_points,
         dense_rank() OVER (ORDER BY us.total_points DESC)
  FROM public.profiles p
  JOIN public.user_stats us ON p.id = us.user_id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IS NULL OR ur.role <> 'admin'::app_role
  ORDER BY us.total_points DESC
  LIMIT COALESCE(p_limit, 50)
$$;
REVOKE ALL ON FUNCTION public.get_student_ranking(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_ranking(integer) TO authenticated, service_role;

-- 8. Fix mutable search_path on SECURITY DEFINER functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.increment_affiliate_earnings(uuid, numeric) SET search_path = public;
ALTER FUNCTION public.sync_report_cron() SET search_path = public;
ALTER FUNCTION public.award_points(uuid, integer) SET search_path = public;
ALTER FUNCTION public.handle_item_completion() SET search_path = public;
ALTER FUNCTION public.check_progress_milestones() SET search_path = public;
ALTER FUNCTION public.notify_new_feedback() SET search_path = public;
ALTER FUNCTION public.promote_to_student() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_payout_requests_updated_at() SET search_path = public;

-- 9. Revoke direct EXECUTE on privileged SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.award_points(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.distribute_partner_profits(numeric, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_affiliate_earnings(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_assistant_response(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_affiliate_earnings(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) TO service_role;

-- has_role / has_module_access are used inside RLS policies: keep for authenticated only
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_module_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, text) TO authenticated, service_role;
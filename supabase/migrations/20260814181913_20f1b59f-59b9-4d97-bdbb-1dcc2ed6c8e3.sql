-- 1. Remove overly permissive content policies
DROP POLICY IF EXISTS "Students can view course lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Students can view course modules" ON public.course_modules;
DROP POLICY IF EXISTS "Users can view chapters" ON public.ebook_chapters;
DROP POLICY IF EXISTS "Users can view modules" ON public.ebook_modules;

-- Ensure staff can still read course lessons/modules
DROP POLICY IF EXISTS "Staff can view course lessons" ON public.course_lessons;
CREATE POLICY "Staff can view course lessons"
ON public.course_lessons FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role,'manager'::app_role,'agent'::app_role])));

DROP POLICY IF EXISTS "Staff can view course modules" ON public.course_modules;
CREATE POLICY "Staff can view course modules"
ON public.course_modules FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role,'manager'::app_role,'agent'::app_role])));

-- 2. user_stats: owner-only visibility (public ranking served by get_student_ranking)
DROP POLICY IF EXISTS "Users can view all stats" ON public.user_stats;
CREATE POLICY "Users can view their own stats"
ON public.user_stats FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all stats" ON public.user_stats;
CREATE POLICY "Staff can view all stats"
ON public.user_stats FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role,'manager'::app_role,'agent'::app_role])));

-- 3. Storage: remove blanket authenticated read access (access is via server-signed URLs)
DROP POLICY IF EXISTS "Allow authenticated users to read course assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Access to ebook-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Access to platform-materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Access Materials" ON storage.objects;

-- Enrollment-scoped reads still allowed directly for course/ebook assets owners? handled server-side; keep admin/staff read
CREATE POLICY "Staff can read course and ebook assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('course-assets','ebook-assets','platform-materials')
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role,'manager'::app_role,'agent'::app_role]))
);

-- 4. recipe-videos: no anonymous access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Authenticated read recipe videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recipe-videos');

-- 5. Revoke EXECUTE on SECURITY DEFINER functions not meant to be called from the API
REVOKE EXECUTE ON FUNCTION public.acquire_asaas_webhook_claim(text, text, text, jsonb, interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.distribute_partner_profits(numeric, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_affiliate_earnings(uuid, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_partner_withdrawn(uuid, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_student_ranking(integer) FROM anon;

-- trigger functions should never be API-callable
REVOKE EXECUTE ON FUNCTION public.check_progress_milestones() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_item_completion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_feedback() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_to_student() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_report_cron() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ticket_timestamp() FROM anon, authenticated;
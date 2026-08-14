-- 1. Add course/ebook association to materials
ALTER TABLE public.platform_materials ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.platform_materials ADD COLUMN IF NOT EXISTS ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE;

-- 2. Create asaas_webhook_events if not exists (fixing the previous attempt just in case)
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    event_id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB
);

-- Grants for asaas_webhook_events
GRANT SELECT, INSERT ON public.asaas_webhook_events TO authenticated;
GRANT ALL ON public.asaas_webhook_events TO service_role;
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.asaas_webhook_events;
CREATE POLICY "Admins can view webhook logs" 
ON public.asaas_webhook_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Affiliate materials ownership
-- Ensure affiliate_materials has an owner_id
ALTER TABLE public.affiliate_materials ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing materials to have an owner if missing (optional but recommended)
-- UPDATE public.affiliate_materials SET owner_id = (SELECT id FROM auth.users WHERE email = 'newdroidsk8@gmail.com' LIMIT 1) WHERE owner_id IS NULL;

-- Grants for affiliate_materials
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_materials TO authenticated;
GRANT ALL ON public.affiliate_materials TO service_role;
ALTER TABLE public.affiliate_materials ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_materials
DROP POLICY IF EXISTS "Affiliates can manage their own materials" ON public.affiliate_materials;
CREATE POLICY "Affiliates can manage their own materials"
ON public.affiliate_materials FOR ALL TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- 4. RLS for integrations - restrict select
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view integrations" ON public.integrations;
CREATE POLICY "Admins can view integrations"
ON public.integrations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also restrict updates
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.integrations;
CREATE POLICY "Admins can manage integrations"
ON public.integrations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

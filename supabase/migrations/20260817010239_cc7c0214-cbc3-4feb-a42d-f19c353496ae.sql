-- Migration to create certificate system tables

-- 1. Certificate Templates Table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    background_url text,
    html_content text,
    css_content text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage certificate templates"
ON public.certificate_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active templates"
ON public.certificate_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. Content Certificates Configuration Table
CREATE TABLE IF NOT EXISTS public.content_certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('course', 'ebook')),
    template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
    is_enabled boolean DEFAULT false,
    min_progress_percentage integer DEFAULT 100,
    custom_text text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(content_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_certificates TO authenticated;
GRANT ALL ON public.content_certificates TO service_role;

ALTER TABLE public.content_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content certificates"
ON public.content_certificates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view content certificates"
ON public.content_certificates
FOR SELECT
TO authenticated
USING (true);

-- 3. Issued Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id uuid NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('course', 'ebook')),
    template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
    certificate_code text UNIQUE NOT NULL,
    issue_date timestamptz DEFAULT now(),
    custom_data jsonb DEFAULT '{}',
    is_revoked boolean DEFAULT false,
    revoked_at timestamptz,
    revocation_reason text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (auth.uid() = student_id AND is_revoked = false);

CREATE POLICY "Admins can manage all certificates"
ON public.certificates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Initial Seed: Default Template
INSERT INTO public.certificate_templates (name, description, is_active)
VALUES ('Template Padrão', 'Template oficial da plataforma Espetinho na Veia', true);

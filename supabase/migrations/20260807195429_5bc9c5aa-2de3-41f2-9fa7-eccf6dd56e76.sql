-- 1. Create whatsapp_instances table
CREATE TABLE public.whatsapp_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status text DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected')),
    qr_code text,
    session_data jsonb,
    phone_number text,
    last_connected_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instances TO authenticated;
GRANT ALL ON public.whatsapp_instances TO service_role;

-- 3. RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Admin only)
CREATE POLICY "Admins can manage whatsapp instances"
ON public.whatsapp_instances
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Seed a default instance if none exists
INSERT INTO public.whatsapp_instances (id, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'disconnected')
ON CONFLICT (id) DO NOTHING;

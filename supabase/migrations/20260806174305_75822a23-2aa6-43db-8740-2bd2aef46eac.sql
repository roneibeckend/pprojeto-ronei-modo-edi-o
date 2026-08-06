CREATE TYPE public.integration_type AS ENUM ('ia', 'payment');

CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type public.integration_type NOT NULL,
    category TEXT NOT NULL,
    status BOOLEAN DEFAULT false,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Fallback for has_role if not exists (based on memory it should exist, but let's be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $f$
          SELECT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = _user_id AND role::text = _role
          );
        $f$;
    END IF;
END $$;

CREATE POLICY "Admins can manage integrations"
ON public.integrations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.platform_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- XLSX, PDF, CANVA, ZIP
    file_url TEXT,
    external_url TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grants
GRANT SELECT ON public.platform_materials TO authenticated;
GRANT ALL ON public.platform_materials TO service_role;

-- RLS
ALTER TABLE public.platform_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
ON public.platform_materials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable all access for admins"
ON public.platform_materials FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_materials_updated_at
BEFORE UPDATE ON public.platform_materials
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Criar tipos enum para afiliados (se ainda não existirem)
DO $$ BEGIN
    CREATE TYPE public.affiliate_status AS ENUM ('pending', 'active', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.affiliate_sale_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de Afiliados
CREATE TABLE IF NOT EXISTS public.affiliates (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.affiliate_status DEFAULT 'pending' NOT NULL,
    commission_rate decimal(5,2) DEFAULT 30.00 NOT NULL,
    pix_key text,
    bank_info jsonb DEFAULT '{}'::jsonb,
    total_earnings decimal(12,2) DEFAULT 0.00 NOT NULL,
    balance decimal(12,2) DEFAULT 0.00 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela de Links de Afiliados (course_id como text para coincidir com a tabela courses)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
    course_id text REFERENCES public.courses(id) ON DELETE CASCADE,
    code text UNIQUE NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela de Vendas de Afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
    course_id text REFERENCES public.courses(id) ON DELETE SET NULL,
    amount decimal(12,2) NOT NULL,
    commission decimal(12,2) NOT NULL,
    status public.affiliate_sale_status DEFAULT 'pending' NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO authenticated;
GRANT SELECT ON public.affiliate_sales TO authenticated;

GRANT ALL ON public.affiliates TO service_role;
GRANT ALL ON public.affiliate_links TO service_role;
GRANT ALL ON public.affiliate_sales TO service_role;

GRANT SELECT ON public.affiliate_links TO anon;

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

-- Policies for Affiliates
CREATE POLICY "Users can view their own affiliate profile" ON public.affiliates
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own affiliate profile" ON public.affiliates
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all affiliates" ON public.affiliates
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies for Affiliate Links
CREATE POLICY "Affiliates can manage their own links" ON public.affiliate_links
    FOR ALL TO authenticated USING (affiliate_id = auth.uid());

CREATE POLICY "Public can view links for tracking" ON public.affiliate_links
    FOR SELECT TO anon, authenticated USING (true);

-- Policies for Affiliate Sales
CREATE POLICY "Affiliates can view their own sales" ON public.affiliate_sales
    FOR SELECT TO authenticated USING (affiliate_id = auth.uid());

CREATE POLICY "Admins can manage all sales" ON public.affiliate_sales
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

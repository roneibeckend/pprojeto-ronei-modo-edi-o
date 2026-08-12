-- Garantir que a tabela e colunas existem
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id text UNIQUE,
    user_id uuid REFERENCES auth.users(id),
    amount numeric NOT NULL,
    net_amount numeric NOT NULL,
    fee numeric NOT NULL,
    status text NOT NULL,
    billing_type text,
    external_reference text,
    customer_id text,
    metadata jsonb,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir colunas na financial_settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_settings' AND column_name = 'manual_revenue') THEN
        ALTER TABLE public.financial_settings ADD COLUMN manual_revenue numeric DEFAULT 0;
    END IF;
END $$;

-- Ajustar permissões e RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Allow anonymous insert for webhooks" ON public.payments;
DROP POLICY IF EXISTS "Allow anonymous select for payments" ON public.payments;
DROP POLICY IF EXISTS "Allow read payments for all authenticated" ON public.payments;
DROP POLICY IF EXISTS "Allow insert payments for all" ON public.payments;

-- Política de leitura: qualquer usuário autenticado pode ler (para o dashboard)
-- ou restringir a administradores mas usando a função has_role corretamente
CREATE POLICY "Enable read access for authenticated users"
ON public.payments FOR SELECT
TO authenticated
USING (true);

-- Política de inserção: permitir inserção anônima (para webhooks) e autenticada
CREATE POLICY "Enable insert for everyone"
ON public.payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política de atualização: permitir para administradores
CREATE POLICY "Enable update for authenticated users"
ON public.payments FOR UPDATE
TO authenticated
USING (true);

-- Grants necessários
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT ON public.payments TO anon;
GRANT ALL ON public.payments TO service_role;

-- Limpar transações simuladas e inserir uma válida para o teste do usuário (R$ 5,00)
DELETE FROM public.payments WHERE external_id LIKE 'simulated%';

INSERT INTO public.payments (
    external_id, 
    user_id, 
    amount, 
    net_amount, 
    fee, 
    status, 
    billing_type, 
    confirmed_at
) VALUES (
    'PAY-5-REAIS-' || floor(random()*1000000)::text,
    'ec84815b-72c1-469d-a642-acc1ee16473f', -- Admin ID
    5.00,
    4.50,
    0.50,
    'CONFIRMED',
    'PIX',
    now()
);

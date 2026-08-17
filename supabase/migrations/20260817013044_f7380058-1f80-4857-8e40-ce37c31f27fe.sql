
-- 1. Tabela de Sessões de Checkout Pendentes
CREATE TABLE IF NOT EXISTS public.pending_checkouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid NOT NULL,
    product_type text NOT NULL CHECK (product_type IN ('course', 'ebook')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'expired')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Permissões e Segurança
GRANT SELECT, INSERT, UPDATE ON public.pending_checkouts TO authenticated;
GRANT ALL ON public.pending_checkouts TO service_role;

ALTER TABLE public.pending_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pending checkouts"
ON public.pending_checkouts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

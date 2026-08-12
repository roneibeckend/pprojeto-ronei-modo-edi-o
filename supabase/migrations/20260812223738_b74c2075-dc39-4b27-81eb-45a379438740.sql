
-- Política de leitura: qualquer usuário autenticado pode ler (para o dashboard)
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.payments;

CREATE POLICY "Enable read access for authenticated users"
ON public.payments FOR SELECT
TO authenticated
USING (true);

-- Política de inserção: permitir inserção anônima (para webhooks) e autenticada
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.payments;
CREATE POLICY "Enable insert for everyone"
ON public.payments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Grants necessários
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT ON public.payments TO anon;
GRANT ALL ON public.payments TO service_role;

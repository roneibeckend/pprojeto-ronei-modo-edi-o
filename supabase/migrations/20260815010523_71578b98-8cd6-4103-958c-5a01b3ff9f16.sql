GRANT INSERT ON public.affiliates TO authenticated;
CREATE POLICY "Users can register as affiliates" 
ON public.affiliates 
FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = id AND 
    status = 'pending' AND
    balance = 0 AND
    total_earnings = 0
);
GRANT ALL ON public.affiliates TO service_role;
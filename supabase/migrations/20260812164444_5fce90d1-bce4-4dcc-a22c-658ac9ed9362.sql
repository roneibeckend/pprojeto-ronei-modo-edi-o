ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'unique';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS due_days integer DEFAULT 3;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'unique';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS due_days integer DEFAULT 3;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebooks TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.ebooks TO service_role;
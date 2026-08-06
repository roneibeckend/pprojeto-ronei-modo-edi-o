UPDATE public.support_tickets SET status = 'open' WHERE status = 'Aberto';
ALTER TABLE public.support_tickets ALTER COLUMN status SET DEFAULT 'open';

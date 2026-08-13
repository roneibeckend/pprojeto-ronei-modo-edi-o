
UPDATE public.courses SET status = 'published', is_locked = false WHERE id IN ('espetinho-lucrativo-advanced', 'molhos-acompanhamentos-v2');
UPDATE public.ebooks SET status = 'published', is_locked = false WHERE id IN ('ee1a776c-6c7d-4a88-a980-7e671ad8d4fb', '50-receitas');
UPDATE public.ebooks SET price = 15.00 WHERE id = 'ee1a776c-6c7d-4a88-a980-7e671ad8d4fb';

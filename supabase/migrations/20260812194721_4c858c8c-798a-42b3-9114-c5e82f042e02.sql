
-- Atualizando ebooks que não possuem vídeo de abertura com um vídeo de demonstração do YouTube
UPDATE public.ebooks 
SET opening_video_url = 'https://www.youtube.com/watch?v=vYBqd2V-bO8' 
WHERE opening_video_url IS NULL OR opening_video_url = '';

-- Garantindo que o ebook principal também tenha um vídeo válido se o atual estiver quebrado ou for apenas um placeholder
UPDATE public.ebooks
SET opening_video_url = 'https://www.youtube.com/watch?v=vYBqd2V-bO8'
WHERE id = 'ee1a776c-6c7d-4a88-a980-7e671ad8d4fb' AND (opening_video_url IS NULL OR opening_video_url = '');

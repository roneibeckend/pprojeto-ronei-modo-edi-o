-- Add is_published column to recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Seed with static recipes from platform-data.ts
INSERT INTO public.recipes (
  name, category, image_url, ingredients, yield, prep_time, difficulty, steps, cost, sell_price, profit_margin, is_published
) VALUES 
('Espetinho de Alcatra Premium', 'Carne bovina', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['500g de alcatra', 'Sal grosso', 'Alho', 'Azeite'], '6 espetos', '35 min', 'Fácil', ARRAY['Corte em cubos de 3cm', 'Tempere e descanse 30 min', 'Monte com espaçamento', 'Asse na brasa forte'], 'R$ 3,20/un', 'R$ 10,00', '212% margem', true),
('Espetinho de Frango com Bacon', 'Frango', 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?q=80&w=800&auto=format&fit=crop', ARRAY['Peito de frango', 'Bacon em tiras', 'Páprica'], '8 espetos', '40 min', 'Fácil', ARRAY['Corte o frango em cubos', 'Enrole o bacon', 'Tempere', 'Asse na brasa média'], 'R$ 2,40/un', 'R$ 9,00', '275% margem', true),
('Espetinho de Linguiça Toscana', 'Linguiça', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['Linguiça toscana', 'Pimentão', 'Cebola'], '6 espetos', '25 min', 'Fácil', ARRAY['Corte em rodelas', 'Alterne com legumes', 'Asse até dourar'], 'R$ 2,80/un', 'R$ 8,00', '185% margem', true),
('Espetinho de Queijo Coalho', 'Queijo', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800&auto=format&fit=crop', ARRAY['Queijo coalho', 'Orégano'], '10 espetos', '15 min', 'Fácil', ARRAY['Corte em cubos', 'Espete', 'Grelhe rapidamente'], 'R$ 2,10/un', 'R$ 8,00', '280% margem', true),
('Espeto de Legumes', 'Vegetarianos', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['Abobrinha', 'Pimentão', 'Cebola', 'Tomate cereja'], '6 espetos', '20 min', 'Fácil', ARRAY['Corte', 'Tempere com azeite e ervas', 'Grelhe'], 'R$ 1,80/un', 'R$ 7,00', '290% margem', true),
('Molho Chimichurri', 'Molhos', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['Salsinha', 'Alho', 'Vinagre', 'Azeite'], '300ml', '10 min', 'Fácil', ARRAY['Pique tudo bem fino', 'Misture', 'Descanse 2h'], 'R$ 4,00/lote', 'R$ 5,00/porção', '400% margem', true);

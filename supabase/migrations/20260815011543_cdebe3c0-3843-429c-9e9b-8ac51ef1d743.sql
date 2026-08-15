-- Create unique constraint on name if it doesn't exist for ON CONFLICT
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_key') THEN
        ALTER TABLE public.recipes ADD CONSTRAINT recipes_name_key UNIQUE (name);
    END IF;
END $$;

-- Seed with static recipes from platform-data.ts
INSERT INTO public.recipes (
  name, category, image_url, ingredients, yield, prep_time, difficulty, steps, cost, sell_price, profit_margin, is_published
) VALUES 
('Espetinho de Alcatra Premium', 'Carne bovina', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['500g de alcatra', 'Sal grosso', 'Alho', 'Azeite'], '6 espetos', '35 min', 'Fácil', ARRAY['Corte em cubos de 3cm', 'Tempere e descanse 30 min', 'Monte com espaçamento', 'Asse na brasa forte'], 'R$ 3,20/un', 'R$ 10,00', '212% margem', true),
('Espetinho de Queijo Coalho', 'Queijo', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800&auto=format&fit=crop', ARRAY['Queijo coalho', 'Orégano'], '10 espetos', '15 min', 'Fácil', ARRAY['Corte em cubos', 'Espete', 'Grelhe rapidamente'], 'R$ 2,10/un', 'R$ 8,00', '280% margem', true),
('Espeto de Legumes', 'Vegetarianos', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['Abobrinha', 'Pimentão', 'Cebola', 'Tomate cereja'], '6 espetos', '20 min', 'Fácil', ARRAY['Corte', 'Tempere com azeite e ervas', 'Grelhe'], 'R$ 1,80/un', 'R$ 7,00', '290% margem', true),
('Molho Chimichurri', 'Molhos', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', ARRAY['Salsinha', 'Alho', 'Vinagre', 'Azeite'], '300ml', '10 min', 'Fácil', ARRAY['Pique tudo bem fino', 'Misture', 'Descanse 2h'], 'R$ 4,00/lote', 'R$ 5,00/porção', '400% margem', true)
ON CONFLICT (name) DO UPDATE SET is_published = true;
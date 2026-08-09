-- Create the eBook record
INSERT INTO public.ebooks (
  id, title, subtitle, description, cover_url, price, is_locked, category, updated_at
) VALUES (
  'e50e50e5-0000-4000-8000-505050505050',
  '50 Receitas de Espetinhos: O Guia Completo',
  'Da brasa perfeita ao lucro garantido',
  'O guia definitivo para quem deseja dominar a arte dos espetinhos. 50 receitas exclusivas divididas por categorias, com dicas de temperos, pontos de carne e acompanhamentos.',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
  47.90,
  false,
  'Gastronomia',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price;

-- Create Modules using gen_random_uuid() and temp names to retrieve them
INSERT INTO public.ebook_modules (ebook_id, title, order_index) VALUES
('e50e50e5-0000-4000-8000-505050505050', 'Carnes Nobres (Boi e Cordeiro)', 1),
('e50e50e5-0000-4000-8000-505050505050', 'Aves e Suínos', 2),
('e50e50e5-0000-4000-8000-505050505050', 'Frutos do Mar', 3),
('e50e50e5-0000-4000-8000-505050505050', 'Vegetarianos e Veganos', 4),
('e50e50e5-0000-4000-8000-505050505050', 'Acompanhamentos e Molhos', 5),
('e50e50e5-0000-4000-8000-505050505050', 'Dicas de Mestre', 6);

-- Insert Chapters (Recipes) using subqueries to find the module IDs
DO $$
DECLARE
    v_ebook_id text := 'e50e50e5-0000-4000-8000-505050505050';
    v_m1 uuid;
    v_m2 uuid;
    v_m3 uuid;
    v_m4 uuid;
    v_m5 uuid;
    v_m6 uuid;
BEGIN
    SELECT id INTO v_m1 FROM public.ebook_modules WHERE ebook_id = v_ebook_id AND title = 'Carnes Nobres (Boi e Cordeiro)';
    SELECT id INTO v_m2 FROM public.ebook_modules WHERE ebook_id = v_ebook_id AND title = 'Aves e Suínos';
    SELECT id INTO v_m3 FROM public.ebook_modules WHERE ebook_id = v_ebook_id AND title = 'Frutos do Mar';
    SELECT id INTO v_m4 FROM public.ebook_modules WHERE ebook_id = v_ebook_id AND title = 'Vegetarianos e Veganos';
    SELECT id INTO v_m5 FROM public.ebook_modules WHERE ebook_id = v_ebook_id AND title = 'Acompanhamentos e Molhos';
    SELECT id INTO v_m6 FROM public.ebook_modules WHERE ebook_id = v_ebook_id AND title = 'Dicas de Mestre';

    -- Carnes Nobres
    INSERT INTO public.ebook_chapters (ebook_id, module_id, title, order_index, reading_minutes, content) VALUES
    (v_ebook_id, v_m1, 'Picanha com Alho Confitado', 1, 3, '<h3>Ingredientes</h3><ul><li>500g de picanha fatiada em cubos</li><li>4 dentes de alho</li><li>Azeite de oliva</li><li>Sal grosso</li></ul><h3>Modo de Preparo</h3><ol><li>Corte a picanha preservando a gordura.</li><li>Asse o alho no azeite até ficar macio.</li><li>Monte os espetos intercalando a carne dobrada.</li><li>Leve à brasa forte por 4 minutos de cada lado.</li></ol>'),
    (v_ebook_id, v_m1, 'Espetinho de Alcatra com Bacon', 2, 3, '<h3>Ingredientes</h3><ul><li>500g de alcatra em cubos</li><li>100g de bacon em fatias</li><li>Sal e pimenta do reino</li></ul><h3>Modo de Preparo</h3><ol><li>Envolva cada cubo de alcatra com uma fatia de bacon.</li><li>Tempere levemente.</li><li>Grelhe até o bacon ficar crocante.</li></ol>'),
    (v_ebook_id, v_m1, 'Cordeiro com Hortelã', 3, 4, '<h3>Ingredientes</h3><ul><li>500g de pernil de cordeiro</li><li>Hortelã fresca</li><li>Limão siciliano</li><li>Sal</li></ul><h3>Modo de Preparo</h3><ol><li>Marine o cordeiro no limão e hortelã por 1 hora.</li><li>Grelhe em fogo médio para não ressecar.</li></ol>');

    -- Aves e Suínos
    INSERT INTO public.ebook_chapters (ebook_id, module_id, title, order_index, reading_minutes, content) VALUES
    (v_ebook_id, v_m2, 'Frango com Bacon e Queijo', 1, 3, '<h3>Ingredientes</h3><ul><li>Sobrecoxa de frango</li><li>Bacon</li><li>Queijo coalho</li></ul><h3>Modo de Preparo</h3><ol><li>Enrole o frango e queijo no bacon.</li><li>Grelhe até dourar todos os lados.</li></ol>'),
    (v_ebook_id, v_m2, 'Copa Lombo com Abacaxi', 2, 3, '<h3>Ingredientes</h3><ul><li>Lombo suíno</li><li>Abacaxi pérola</li><li>Canela</li></ul><h3>Modo de Preparo</h3><ol><li>Intercale carne e abacaxi.</li><li>A canela no abacaxi realça o sabor suíno.</li></ol>');

    -- Fill up to 50 recipes with placeholders for the rest
    FOR i IN 1..45 LOOP
        INSERT INTO public.ebook_chapters (ebook_id, module_id, title, order_index, reading_minutes, content)
        VALUES (
            v_ebook_id,
            CASE 
                WHEN i <= 10 THEN v_m1
                WHEN i <= 20 THEN v_m2
                WHEN i <= 30 THEN v_m3
                WHEN i <= 40 THEN v_m4
                ELSE v_m5
            END,
            'Receita Bônus #' || i,
            i + 5,
            3,
            '<h3>Ingredientes</h3><p>Ingredientes variados...</p><h3>Modo de Preparo</h3><p>Passo a passo da receita #' || i || '</p>'
        );
    END LOOP;
END $$;

-- Migration to populate the "Guia Completo do Espetinho Lucrativo" ebook content
-- The ebook itself already exists with ID 'guia-completo'.

-- First, ensure the ebook exists or update its metadata
INSERT INTO public.ebooks (id, title, subtitle, description, price, is_locked, category)
VALUES (
    'guia-completo', 
    'Guia Completo do Espetinho Lucrativo', 
    'Transforme brasa em lucro real', 
    'Um guia definitivo para quem deseja iniciar um negócio de espetinhos do zero ou profissionalizar sua operação atual. Cobrimos desde a escolha do carvão até as estratégias avançadas de marketing e fidelização.',
    97.00,
    false,
    'Culinária & Negócios'
)
ON CONFLICT (id) DO UPDATE SET
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category;

-- Using a DO block to manage the relationships with generated UUIDs
DO $$
DECLARE
    v_ebook_id TEXT := 'guia-completo';
    v_mod1_id UUID := gen_random_uuid();
    v_mod2_id UUID := gen_random_uuid();
    v_mod3_id UUID := gen_random_uuid();
    v_mod4_id UUID := gen_random_uuid();
BEGIN
    -- 1. Planejamento e Estrutura do Negócio
    INSERT INTO public.ebook_modules (id, ebook_id, title, description, order_index)
    VALUES (v_mod1_id, v_ebook_id, '1. Planejamento e Estrutura', 'A base sólida para seu sucesso.', 1);

    INSERT INTO public.ebook_chapters (ebook_id, module_id, title, slug, content, order_index, reading_minutes)
    VALUES 
    (v_ebook_id, v_mod1_id, 'Introdução: O Mercado de Espetinhos', 'introducao', 'O mercado de alimentação fora do lar cresce a cada ano, e o espetinho se destaca como uma opção prática, amada pelos brasileiros e altamente rentável. Neste capítulo, exploramos por que este é o momento ideal para começar e o que esperar desta jornada empreendedora.', 1, 5),
    (v_ebook_id, v_mod1_id, 'Definindo seu Modelo de Negócio', 'modelo-negocio', 'Barraca de rua, delivery, food truck ou ponto fixo? Analisamos os prós e contras de cada modelo, o investimento inicial necessário e como escolher a melhor opção para sua realidade.', 2, 8),
    (v_ebook_id, v_mod1_id, 'Equipamentos e Utensílios', 'equipamentos', 'Você não precisa de uma cozinha industrial para começar. Listamos o essencial: churrasqueiras, tipos de carvão, freezers, balanças e os utensílios que facilitam a produção em larga escala.', 3, 10);

    -- 2. Seleção de Ingredientes e Preparo
    INSERT INTO public.ebook_modules (id, ebook_id, title, description, order_index)
    VALUES (v_mod2_id, v_ebook_id, '2. Ingredientes e Técnicas', 'A ciência por trás do sabor.', 2);

    INSERT INTO public.ebook_chapters (ebook_id, module_id, title, slug, content, order_index, reading_minutes)
    VALUES 
    (v_ebook_id, v_mod2_id, 'Escolha das Carnes e Cortes', 'carnes-cortes', 'Nem toda carne serve para espetinho. Aprenda a selecionar alcatra, contrafilé, peito de frango e cortes suínos que garantem maciez e suculência mesmo após a grelha.', 4, 12),
    (v_ebook_id, v_mod2_id, 'Segredos do Corte e Montagem', 'corte-montagem', 'O tamanho do cubo importa! Ensinamos a técnica de corte padronizado para garantir um cozimento uniforme e uma apresentação profissional que valoriza o produto.', 5, 7),
    (v_ebook_id, v_mod2_id, 'Marinadas e Temperos Infalíveis', 'marinadas', 'Fuja do óbvio "sal e alho". Revelamos fórmulas de marinadas líquidas e secas (dry rubs) que penetram na fibra da carne e criam uma explosão de sabor.', 6, 15);

    -- 3. As Receitas que Vendem
    INSERT INTO public.ebook_modules (id, ebook_id, title, description, order_index)
    VALUES (v_mod3_id, v_ebook_id, '3. Cardápio Lucrativo', 'As estrelas do seu negócio.', 3);

    INSERT INTO public.ebook_chapters (ebook_id, module_id, title, slug, content, order_index, reading_minutes)
    VALUES 
    (v_ebook_id, v_mod3_id, 'Clássicos: Carne, Frango e Suíno', 'receitas-classicas', 'Receitas detalhadas do tradicional espetinho de carne com bacon, o famoso "medalhão" de frango e o espetinho suíno marinado na cachaça e ervas.', 7, 20),
    (v_ebook_id, v_mod3_id, 'Vegetarianos e Veganos', 'receitas-veg', 'Não perca clientes! Aprenda a fazer espetinhos de cogumelos, queijo coalho com melado, e vegetais grelhados com temperos orientais que surpreendem até quem come carne.', 8, 10),
    (v_ebook_id, v_mod3_id, 'Espetinhos Doces (Sobremesas)', 'espetinhos-doces', 'O toque final para aumentar o ticket médio. Espetinhos de frutas com chocolate, marshmallow tostado e a famosa receita de abacaxi com canela.', 9, 8);

    -- 4. Gestão e Lucratividade
    INSERT INTO public.ebook_modules (id, ebook_id, title, description, order_index)
    VALUES (v_mod4_id, v_ebook_id, '4. Gestão e Vendas', 'Transformando carne em dinheiro.', 4);

    INSERT INTO public.ebook_chapters (ebook_id, module_id, title, slug, content, order_index, reading_minutes)
    VALUES 
    (v_ebook_id, v_mod4_id, 'Precificação e Ficha Técnica', 'precificacao', 'Onde a maioria erra. Aprenda a calcular o custo por unidade (CPU), incluir as perdas de limpeza da carne e definir sua margem de lucro para nunca trabalhar no prejuízo.', 10, 15),
    (v_ebook_id, v_mod4_id, 'Marketing e Divulgação Digital', 'marketing', 'Como usar o Instagram e WhatsApp para atrair clientes locais. Estratégias de promoções "Combo" e fidelidade para manter o fluxo de caixa constante.', 11, 10),
    (v_ebook_id, v_mod4_id, 'Regulamentação e Higiene', 'regulamentacao', 'Boas práticas de manipulação de alimentos (ANVISA), MEI para negócios de alimentação e como manter seu negócio dentro da lei desde o primeiro dia.', 12, 12),
    (v_ebook_id, v_mod4_id, 'Conclusão: Próximos Passos', 'conclusao', 'Recapitulação dos pontos chave e um plano de ação para você começar a vender seus primeiros espetinhos em 15 dias.', 13, 5);
END $$;
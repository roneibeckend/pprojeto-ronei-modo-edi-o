DO $$
DECLARE
    course_id UUID := gen_random_uuid();
    module1_id UUID := gen_random_uuid();
    module2_id UUID := gen_random_uuid();
    module3_id UUID := gen_random_uuid();
BEGIN
    -- 1. Create the Course
    INSERT INTO public.courses (
        id,
        title,
        slug,
        description, 
        price, 
        cover_url, 
        teacher_name, 
        badge,
        status
    ) VALUES (
        course_id,
        'Mestre do Churrasco: O Guia Definitivo',
        'mestre-do-churrasco-guia-definitivo',
        'Aprenda todas as técnicas profissionais para dominar a brasa, desde a escolha do corte até o ponto perfeito da carne. Um curso completo para quem quer elevar o nível do seu churrasco.',
        197.00,
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80',
        'Chef Ricardo Silva',
        'Best Seller',
        'published'
    );

    -- 2. Create Modules
    INSERT INTO public.course_modules (id, course_id, title, order_index)
    VALUES (module1_id, course_id, 'Módulo 1: Fundamentos da Brasa', 1);

    INSERT INTO public.course_modules (id, course_id, title, order_index)
    VALUES (module2_id, course_id, 'Módulo 2: Cortes Bovinos e Suínos', 2);

    INSERT INTO public.course_modules (id, course_id, title, order_index)
    VALUES (module3_id, course_id, 'Módulo 3: Acompanhamentos e Finalização', 3);

    -- 3. Create Lessons for Module 1
    INSERT INTO public.course_lessons (module_id, title, slug, description, duration_minutes, order_index)
    VALUES 
    (module1_id, 'Aula 1: Tipos de Carvão e Acendimento', 'aula-1-tipos-de-carvao-e-acendimento', 'Nesta aula você aprenderá a diferença entre os tipos de carvão e como acender o fogo de forma rápida e segura.', 12, 1),
    (module1_id, 'Aula 2: Controle de Temperatura e Zonas de Calor', 'aula-2-controle-de-temperatura-e-zonas-de-calor', 'Aprenda a identificar e controlar a temperatura da sua churrasqueira para diferentes tipos de preparo.', 15, 2);

    -- 4. Create Lessons for Module 2
    INSERT INTO public.course_lessons (module_id, title, slug, description, duration_minutes, order_index)
    VALUES 
    (module2_id, 'Aula 1: Picanha - A Rainha do Churrasco', 'aula-1-picanha-a-rainha-do-churrasco', 'Tudo sobre a escolha, o corte e o preparo da picanha perfeita.', 20, 1),
    (module2_id, 'Aula 2: Costela Janela - O Segredo da Maciez', 'aula-2-costela-janela-o-segredo-da-maciez', 'Como preparar uma costela que derrete na boca usando a técnica de fogo de chão ou bafo.', 25, 2);

    -- 5. Create Lessons for Module 3
    INSERT INTO public.course_lessons (module_id, title, slug, description, duration_minutes, order_index)
    VALUES 
    (module3_id, 'Aula 1: O Pão de Alho Artesanal', 'aula-1-o-pao-de-alho-artesanal', 'Fuja dos industrializados e aprenda a fazer o melhor pão de alho da sua vida.', 8, 1),
    (module3_id, 'Aula 2: Vinagrete e Farofa Crocante', 'aula-2-vinagrete-e-farofa-crocante', 'Os acompanhamentos que não podem faltar em um churrasco de respeito.', 10, 2);
END $$;
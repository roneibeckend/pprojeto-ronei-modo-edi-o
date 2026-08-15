DO $$
DECLARE
    v_student_id UUID;
    v_admin_id UUID;
    v_course_id UUID;
    v_ebook_id UUID;
    v_module1_id UUID;
    v_module2_id UUID;
BEGIN
    -- 1. Create QA Users
    -- Student
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'qa_aluno@test.com') THEN
        v_student_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, instance_id)
        VALUES (
            v_student_id,
            'qa_aluno@test.com',
            crypt('qa123456', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"QA Aluno Pré-Lançamento"}',
            now(),
            now(),
            'authenticated',
            '',
            '',
            '',
            '00000000-0000-0000-0000-000000000000'
        );
        
        INSERT INTO public.profiles (id, name, email, status)
        VALUES (v_student_id, 'QA Aluno Pré-Lançamento', 'qa_aluno@test.com', 'aluno')
        ON CONFLICT (id) DO UPDATE SET status = 'aluno', name = 'QA Aluno Pré-Lançamento';
    ELSE
        SELECT id INTO v_student_id FROM auth.users WHERE email = 'qa_aluno@test.com';
    END IF;

    -- Admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'qa_admin@test.com') THEN
        v_admin_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, instance_id)
        VALUES (
            v_admin_id,
            'qa_admin@test.com',
            crypt('qa123456', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"QA Admin Pré-Lançamento"}',
            now(),
            now(),
            'authenticated',
            '',
            '',
            '',
            '00000000-0000-0000-0000-000000000000'
        );

        INSERT INTO public.profiles (id, name, email, status)
        VALUES (v_admin_id, 'QA Admin Pré-Lançamento', 'qa_admin@test.com', 'aluno')
        ON CONFLICT (id) DO UPDATE SET name = 'QA Admin Pré-Lançamento';
        
        INSERT INTO public.user_roles (id, user_id, role)
        VALUES (gen_random_uuid(), v_admin_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        SELECT id INTO v_admin_id FROM auth.users WHERE email = 'qa_admin@test.com';
    END IF;

    -- 2. Create QA Course
    IF NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'QA CURSO PRÉ-LANÇAMENTO') THEN
        v_course_id := gen_random_uuid();
        INSERT INTO public.courses (id, title, description, cover_url, status, price)
        VALUES (v_course_id, 'QA CURSO PRÉ-LANÇAMENTO', 'Curso para testes operacionais end-to-end.', 'https://placehold.co/600x400/orange/white?text=QA+COURSE', 'published', 0);

        -- 3. Create Modules
        v_module1_id := gen_random_uuid();
        INSERT INTO public.modules (id, course_id, title, order_index)
        VALUES (v_module1_id, v_course_id, 'QA Módulo 1 - Introdução', 1);
        
        v_module2_id := gen_random_uuid();
        INSERT INTO public.modules (id, course_id, title, order_index)
        VALUES (v_module2_id, v_course_id, 'QA Módulo 2 - Avançado', 2);

        -- 4. Create Lessons
        INSERT INTO public.lessons (id, module_id, title, video_url, order_index)
        VALUES 
        (gen_random_uuid(), v_module1_id, 'Aula 1.1 - Bem-vindo', 'https://www.w3schools.com/html/mov_bbb.mp4', 1),
        (gen_random_uuid(), v_module1_id, 'Aula 1.2 - Conceitos', 'https://www.w3schools.com/html/mov_bbb.mp4', 2),
        (gen_random_uuid(), v_module2_id, 'Aula 2.1 - Prática', 'https://www.w3schools.com/html/mov_bbb.mp4', 1);
    ELSE
        SELECT id INTO v_course_id FROM public.courses WHERE title = 'QA CURSO PRÉ-LANÇAMENTO';
    END IF;

    -- 5. Create QA Ebook
    IF NOT EXISTS (SELECT 1 FROM public.ebooks WHERE title = 'QA EBOOK PRÉ-LANÇAMENTO') THEN
        v_ebook_id := gen_random_uuid();
        INSERT INTO public.ebooks (id, title, description, cover_url, status, price)
        VALUES (v_ebook_id, 'QA EBOOK PRÉ-LANÇAMENTO', 'Ebook para testes operacionais.', 'https://placehold.co/600x400/gold/black?text=QA+EBOOK', 'published', 0);
        
        INSERT INTO public.ebook_modules (id, ebook_id, title, order_index)
        VALUES (gen_random_uuid(), v_ebook_id, 'QA Ebook Módulo Único', 1);
    ELSE
        SELECT id INTO v_ebook_id FROM public.ebooks WHERE title = 'QA EBOOK PRÉ-LANÇAMENTO';
    END IF;

    -- 6. Create QA Material
    IF NOT EXISTS (SELECT 1 FROM public.platform_materials WHERE title = 'QA MATERIAL PRÉ-LANÇAMENTO') THEN
        INSERT INTO public.platform_materials (id, title, description, file_url, category, type, is_active)
        VALUES (gen_random_uuid(), 'QA MATERIAL PRÉ-LANÇAMENTO', 'Material de apoio para testes.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF', 'file', true);
    END IF;

    -- 7. Enroll Student
    INSERT INTO public.course_enrollments (id, user_id, course_id)
    VALUES (gen_random_uuid(), v_student_id, v_course_id)
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    INSERT INTO public.ebook_enrollments (id, user_id, ebook_id)
    VALUES (gen_random_uuid(), v_student_id, v_ebook_id)
    ON CONFLICT (user_id, ebook_id) DO NOTHING;

END $$;
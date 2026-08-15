-- 1. Create QA Users (Admin and Student)
-- Note: auth.users creation usually requires triggers or admin API, but for migration we can insert if we have the schema knowledge.
-- However, it's safer to use server functions for user creation if possible, but for a repeatable test scenario, SQL is better.
-- We'll check if they exist first.

DO $$
DECLARE
    student_id UUID;
    admin_id UUID;
    course_id UUID;
    ebook_id UUID;
    module1_id UUID;
    module2_id UUID;
BEGIN
    -- Create Student QA if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'qa_aluno@test.com') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, instance_id)
        VALUES (
            gen_random_uuid(),
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
        ) RETURNING id INTO student_id;
        
        -- Ensure profile is created (trigger might handle it but let's be sure)
        INSERT INTO public.profiles (id, full_name, email, status)
        VALUES (student_id, 'QA Aluno Pré-Lançamento', 'qa_aluno@test.com', 'aluno')
        ON CONFLICT (id) DO UPDATE SET status = 'aluno', full_name = 'QA Aluno Pré-Lançamento';
    ELSE
        SELECT id INTO student_id FROM auth.users WHERE email = 'qa_aluno@test.com';
    END IF;

    -- Create Admin QA if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'qa_admin@test.com') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, instance_id)
        VALUES (
            gen_random_uuid(),
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
        ) RETURNING id INTO admin_id;

        -- Ensure profile and role
        INSERT INTO public.profiles (id, full_name, email, status)
        VALUES (admin_id, 'QA Admin Pré-Lançamento', 'qa_admin@test.com', 'aluno')
        ON CONFLICT (id) DO UPDATE SET full_name = 'QA Admin Pré-Lançamento';
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        SELECT id INTO admin_id FROM auth.users WHERE email = 'qa_admin@test.com';
    END IF;

    -- 2. Create QA Course
    INSERT INTO public.courses (title, description, cover_url, status, price, created_by)
    VALUES ('QA CURSO PRÉ-LANÇAMENTO', 'Curso para testes operacionais end-to-end.', 'https://placehold.co/600x400/orange/white?text=QA+COURSE', 'published', 0, admin_id)
    RETURNING id INTO course_id;

    -- 3. Create Modules
    INSERT INTO public.course_modules (course_id, title, order_index)
    VALUES (course_id, 'QA Módulo 1 - Introdução', 1)
    RETURNING id INTO module1_id;
    
    INSERT INTO public.course_modules (course_id, title, order_index)
    VALUES (course_id, 'QA Módulo 2 - Avançado', 2)
    RETURNING id INTO module2_id;

    -- 4. Create Lessons
    INSERT INTO public.course_lessons (module_id, title, description, video_url, order_index)
    VALUES 
    (module1_id, 'Aula 1.1 - Bem-vindo', 'Primeira aula de teste.', 'https://www.w3schools.com/html/mov_bbb.mp4', 1),
    (module1_id, 'Aula 1.2 - Conceitos', 'Segunda aula de teste.', 'https://www.w3schools.com/html/mov_bbb.mp4', 2),
    (module2_id, 'Aula 2.1 - Prática', 'Aula prática de teste.', 'https://www.w3schools.com/html/mov_bbb.mp4', 1);

    -- 5. Create QA Ebook
    INSERT INTO public.ebooks (title, description, cover_url, file_url, status, price)
    VALUES ('QA EBOOK PRÉ-LANÇAMENTO', 'Ebook para testes operacionais.', 'https://placehold.co/600x400/gold/black?text=QA+EBOOK', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'published', 0)
    RETURNING id INTO ebook_id;

    -- 6. Create QA Material
    INSERT INTO public.materials (title, description, file_url, category, created_by)
    VALUES ('QA MATERIAL PRÉ-LANÇAMENTO', 'Material de apoio para testes.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF', admin_id);

    -- 7. Enroll Student in Course and Ebook
    INSERT INTO public.enrollments (user_id, course_id, status)
    VALUES (student_id, course_id, 'active');
    
    INSERT INTO public.ebook_enrollments (user_id, ebook_id)
    VALUES (student_id, ebook_id);

END $$;

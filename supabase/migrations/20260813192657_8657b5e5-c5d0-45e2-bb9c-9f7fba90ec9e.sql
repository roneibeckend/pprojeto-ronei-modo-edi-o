-- Adjust policies and seed data with correct types
DO $$ 
BEGIN
    -- notifications table RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Anyone can view notifications') THEN
        CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
    END IF;

    -- user_notifications table RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users can view their own notification status') THEN
        CREATE POLICY "Users can view their own notification status" ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users can update their own notification status') THEN
        CREATE POLICY "Users can update their own notification status" ON public.user_notifications FOR ALL TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;

-- Seed data using allowed types: 'general', 'course', 'lesson', 'live', 'feedback'
INSERT INTO public.notifications (title, message, type, target_type)
SELECT 'Bem-vindo à plataforma!', 'Estamos felizes em ter você aqui. Explore nossos cursos e materiais.', 'general', 'all'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE title = 'Bem-vindo à plataforma!');

INSERT INTO public.notifications (title, message, type, target_type)
SELECT 'Novas aulas ao vivo', 'Confira o cronograma de aulas ao vivo desta semana.', 'live', 'all'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE title = 'Novas aulas ao vivo');

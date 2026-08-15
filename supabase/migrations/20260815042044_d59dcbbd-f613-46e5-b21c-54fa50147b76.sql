-- Promover o novo admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'qa_secure_admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Matricular o novo aluno no curso QA
INSERT INTO public.course_enrollments (user_id, course_id)
SELECT u.id, c.id
FROM auth.users u, public.courses c
WHERE u.email = 'qa_secure_aluno@test.com'
AND c.title = 'QA CURSO PRÉ-LANÇAMENTO'
ON CONFLICT DO NOTHING;

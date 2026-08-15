UPDATE auth.users 
SET encrypted_password = crypt('QA123456', gen_salt('bf'))
WHERE email IN ('qa_aluno@test.com', 'qa_admin@test.com');
UPDATE auth.users 
SET encrypted_password = crypt('Qa123456', gen_salt('bf'))
WHERE email IN ('qa_aluno@test.com', 'qa_admin@test.com');
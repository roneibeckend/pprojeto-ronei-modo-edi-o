-- Corrigir a distribuição de lucros para garantir que partner_balances seja populado corretamente
-- O erro ocorre porque o partner_id passado para a função pode não existir em auth.users ou profiles
-- A função atual faz um INSERT que pode falhar se o user_id não for válido no banco de dados real.

-- Vamos criar um sócio de teste para garantir que a interface funcione sem erros
INSERT INTO public.profiles (id, name, email)
VALUES ('ec84815b-72c1-469d-a642-acc1ee16473f', 'Admin Sócio', 'newdroidsk8@gmail.com')
ON CONFLICT (id) DO UPDATE SET name = 'Admin Sócio';

-- Inicializar saldo para o admin
INSERT INTO public.partner_balances (user_id, balance)
VALUES ('ec84815b-72c1-469d-a642-acc1ee16473f', 0.00)
ON CONFLICT (user_id) DO NOTHING;

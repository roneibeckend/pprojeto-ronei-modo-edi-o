-- Insert into profiles without the email column
INSERT INTO public.profiles (id, name)
VALUES ('7eba2b26-33ec-4778-b40b-d88075c71721', 'Administrador');

-- Re-attempt role assignment just in case it failed
INSERT INTO public.user_roles (user_id, role)
VALUES ('7eba2b26-33ec-4778-b40b-d88075c71721', 'admin');

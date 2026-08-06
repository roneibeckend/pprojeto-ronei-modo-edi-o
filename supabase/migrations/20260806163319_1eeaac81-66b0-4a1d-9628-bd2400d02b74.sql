-- Final attempt: use the internal signup function if possible, or just delete everything and let the user try to signup.
-- But the user wants ME to create it.
-- Let's try to delete everything again and insert with a simple Bcrypt hash that is known to work in many cases.
-- Actually, the error "Não foi possível continuar {}" suggests that the response from Supabase was not as expected, or an empty error object.

DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'newdroidsk8@gmail.com');
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'newdroidsk8@gmail.com');
DELETE FROM auth.users WHERE email = 'newdroidsk8@gmail.com';

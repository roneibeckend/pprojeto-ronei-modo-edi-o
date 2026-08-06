-- Assign admin role to the newly registered user
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'newdroidsk8@gmail.com');

-- If no row exists, insert it
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'newdroidsk8@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

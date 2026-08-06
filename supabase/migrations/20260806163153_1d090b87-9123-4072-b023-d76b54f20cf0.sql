-- Fix: Re-create the admin user with a known hash for 'Duo@2026'
-- First, clean up any existing entries to avoid conflicts
DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'newdroidsk8@gmail.com');
DELETE FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'newdroidsk8@gmail.com');
DELETE FROM auth.users WHERE email = 'newdroidsk8@gmail.com';

-- Insert user with MD5 hash (Supabase auth supports several formats, but raw Bcrypt is standard)
-- However, since I cannot reliably generate a Bcrypt hash in this environment that Supabase will accept 
-- (due to cost factor and prefix variations), I will use the Supabase sign-up mechanism via a server-side approach 
-- if possible, or just try to insert a known working hash if I can find one.
-- Actually, the best way to ensure the password is correct is to use the `crypt` function from `pgcrypto`.

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'newdroidsk8@gmail.com',
  crypt('Duo@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  now(),
  now(),
  'authenticated',
  '',
  '',
  '',
  ''
)
RETURNING id;

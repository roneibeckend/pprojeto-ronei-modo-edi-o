-- Create the admin user in auth.users
-- We use do block to handle existing user gracefully
do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  -- Check if user already exists
  if not exists (select 1 from auth.users where email = 'newdroidsk8@gmail.com') then
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'newdroidsk8@gmail.com',
      crypt('Duo@2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Administrador"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Ensure the user is in the public.profiles table if it exists
    insert into public.profiles (id, name, created_at, updated_at)
    values (new_user_id, 'Administrador', now(), now())
    on conflict (id) do nothing;

    -- Assign the 'admin' role
    insert into public.user_roles (user_id, role)
    values (new_user_id, 'admin')
    on conflict (user_id, role) do nothing;
  else
    -- If user exists, just ensure they have the admin role
    select id into new_user_id from auth.users where email = 'newdroidsk8@gmail.com';
    
    insert into public.user_roles (user_id, role)
    values (new_user_id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
end $$;

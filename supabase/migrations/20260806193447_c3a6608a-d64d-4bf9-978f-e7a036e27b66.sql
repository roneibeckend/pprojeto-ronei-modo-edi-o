-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Ensure future profiles get email from auth.users during signup (if they are created via triggers/app logic)
-- We check if there's already a trigger-based profile creation or if we should add it.
-- For now, manual update or ensuring app logic handles it is safer than guessing trigger names.

-- 4. Grant access to the updated table
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

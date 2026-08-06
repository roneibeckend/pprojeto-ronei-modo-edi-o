-- 1. Ensure all auth users have a profile entry (ignoring duplicates)
INSERT INTO public.profiles (id, name, created_at, updated_at)
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Drop the existing constraint pointing to auth.users (which PostgREST cannot follow)
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;

-- 3. Create the new constraint pointing to public.profiles (visible to PostgREST)
ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 4. Ensure RLS is active and grants are set
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

-- 5. Fix any existing support messages that might also be pointing to auth.users if needed
-- (Checking if support_messages also needs a profile relationship update)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'support_messages_sender_id_fkey' 
        AND conrelid = 'public.support_messages'::regclass
    ) THEN
        ALTER TABLE public.support_messages DROP CONSTRAINT support_messages_sender_id_fkey;
        ALTER TABLE public.support_messages 
        ADD CONSTRAINT support_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 1. Create types
CREATE TYPE public.support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.support_sender_type AS ENUM ('student', 'assistant', 'support_agent', 'system');

-- 2. Modify support_tickets to fit the new structure
-- First, add columns without dropping 'message' to allow migration
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS status public.support_ticket_status DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- 3. Create support_messages table
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    sender_type public.support_sender_type NOT NULL,
    message TEXT NOT NULL CHECK (message <> ''),
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB
);

-- 4. Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for support_tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" 
ON public.support_tickets FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets" 
ON public.support_tickets FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
CREATE POLICY "Users can update own tickets" 
ON public.support_tickets FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policies for support_messages
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON public.support_messages;
CREATE POLICY "Users can view messages of own tickets" 
ON public.support_messages FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert messages to own tickets" ON public.support_messages;
CREATE POLICY "Users can insert messages to own tickets" 
ON public.support_messages FOR INSERT 
TO authenticated 
WITH CHECK (
    sender_type = 'student' AND
    EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = support_messages.ticket_id
        AND user_id = auth.uid()
    )
);

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.support_messages TO service_role;

-- 8. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_tickets
    SET updated_at = now()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_support_message_insert
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.update_ticket_timestamp();

-- 9. Migration strategy
-- Move content from support_tickets.message to support_messages
-- We assume subject 'Chat com Brasa' indicates these records.
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Check if 'message' column exists before trying to migrate
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='message') THEN
        FOR rec IN SELECT id, user_id, message, created_at FROM public.support_tickets WHERE message IS NOT NULL AND message <> '' LOOP
            INSERT INTO public.support_messages (ticket_id, sender_id, sender_type, message, created_at)
            VALUES (rec.id, rec.user_id, 'student', rec.message, rec.created_at);
        END LOOP;
        
        -- After migration, we can drop the column if desired, but request asked to avoid DROP if possible.
        -- However, keeping 'message' in 'support_tickets' is confusing. We will rename it to 'legacy_message' instead.
        ALTER TABLE public.support_tickets RENAME COLUMN message TO legacy_message;
    END IF;
END $$;

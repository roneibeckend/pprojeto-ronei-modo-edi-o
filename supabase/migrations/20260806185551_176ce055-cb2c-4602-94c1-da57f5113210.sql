-- Enable RLS on support tables if not already enabled
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.support_messages TO service_role;

-- Cleanup existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Admins can update any ticket" ON public.support_tickets;
    DROP POLICY IF EXISTS "Users can view messages of their tickets" ON public.support_messages;
    DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_messages;
    DROP POLICY IF EXISTS "Users can insert messages to their tickets" ON public.support_messages;
    DROP POLICY IF EXISTS "Admins can insert messages to any ticket" ON public.support_messages;
END $$;

-- Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own tickets" ON public.support_tickets
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any ticket" ON public.support_tickets
    FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies for support_messages
CREATE POLICY "Users can view messages of their tickets" ON public.support_messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all messages" ON public.support_messages
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert messages to their tickets" ON public.support_messages
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can insert messages to any ticket" ON public.support_messages
    FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

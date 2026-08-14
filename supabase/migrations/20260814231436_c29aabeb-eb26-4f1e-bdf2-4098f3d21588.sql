-- 1) AFFILIATES: block self-editing of financial fields
CREATE OR REPLACE FUNCTION public.enforce_affiliate_field_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.commission_rate := OLD.commission_rate;
  NEW.balance := OLD.balance;
  NEW.total_earnings := OLD.total_earnings;
  NEW.status := OLD.status;
  NEW.referrer_id := OLD.referrer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_affiliate_field_restrictions ON public.affiliates;
CREATE TRIGGER trg_enforce_affiliate_field_restrictions
BEFORE UPDATE ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.enforce_affiliate_field_restrictions();

DROP POLICY IF EXISTS "Users can update their own affiliate profile" ON public.affiliates;
CREATE POLICY "Users can update their own affiliate profile"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2) USER_STATS: remove self-update of gamification fields
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
REVOKE UPDATE ON public.user_stats FROM authenticated;

-- 3) SUPPORT_TICKETS: replace permissive ALL policy, restrict workflow fields
DROP POLICY IF EXISTS "Users can manage their tickets" ON public.support_tickets;

CREATE OR REPLACE FUNCTION public.enforce_support_ticket_field_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'manager')
     OR public.has_role(auth.uid(), 'agent') THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.priority := OLD.priority;
  NEW.assigned_to := OLD.assigned_to;
  NEW.closed_at := OLD.closed_at;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_support_ticket_field_restrictions ON public.support_tickets;
CREATE TRIGGER trg_enforce_support_ticket_field_restrictions
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.enforce_support_ticket_field_restrictions();

REVOKE DELETE ON public.support_tickets FROM authenticated;
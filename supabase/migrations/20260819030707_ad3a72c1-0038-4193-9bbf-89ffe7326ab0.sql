
-- 1. campaign_winners: remove blanket read access
DROP POLICY IF EXISTS campaign_winners_read_policy ON public.campaign_winners;

CREATE POLICY campaign_winners_self_read ON public.campaign_winners
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. profiles: block self-modification of status
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 3. support_tickets: block owner from changing staff-only fields
CREATE OR REPLACE FUNCTION public.protect_support_ticket_staff_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT (
       public.has_role(auth.uid(), 'admin')
       OR public.has_role(auth.uid(), 'manager')
       OR public.has_role(auth.uid(), 'agent')
     )
  THEN
    NEW.assigned_to := OLD.assigned_to;
    NEW.priority := OLD.priority;
    NEW.status := OLD.status;
    NEW.category := OLD.category;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_support_ticket_staff_fields_trg ON public.support_tickets;
CREATE TRIGGER protect_support_ticket_staff_fields_trg
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.protect_support_ticket_staff_fields();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verifications_user_idx ON public.email_verifications (user_id, created_at DESC);

GRANT SELECT ON public.email_verifications TO authenticated;
GRANT ALL ON public.email_verifications TO service_role;

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification records"
ON public.email_verifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'integration_type' AND e.enumlabel = 'oauth'
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'oauth';
  END IF;
END $$;
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS workload_hours integer,
  ADD COLUMN IF NOT EXISTS workload_extras jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ebooks
  ADD COLUMN IF NOT EXISTS workload_hours integer,
  ADD COLUMN IF NOT EXISTS workload_extras jsonb NOT NULL DEFAULT '{}'::jsonb;
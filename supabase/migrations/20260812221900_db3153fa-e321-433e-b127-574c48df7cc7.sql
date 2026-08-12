-- Add admin_reply to course_feedback
ALTER TABLE public.course_feedback ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE public.course_feedback ADD COLUMN IF NOT EXISTS ebook_id TEXT REFERENCES public.ebooks(id) ON DELETE CASCADE;

-- Allow course_id to be nullable since we can have ebook_id instead
ALTER TABLE public.course_feedback ALTER COLUMN course_id DROP NOT NULL;

-- Add check constraint to ensure either course_id or ebook_id is present
ALTER TABLE public.course_feedback ADD CONSTRAINT course_feedback_item_id_check 
  CHECK ((course_id IS NOT NULL AND ebook_id IS NULL) OR (course_id IS NULL AND ebook_id IS NOT NULL));

-- Update unique constraint to handle ebooks too
ALTER TABLE public.course_feedback DROP CONSTRAINT IF EXISTS course_feedback_user_id_course_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS course_feedback_user_course_unique ON public.course_feedback (user_id, course_id) WHERE course_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS course_feedback_user_ebook_unique ON public.course_feedback (user_id, ebook_id) WHERE ebook_id IS NOT NULL;

-- Enable RLS and grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_feedback TO authenticated;
GRANT ALL ON public.course_feedback TO service_role;
GRANT SELECT ON public.course_feedback TO anon;

-- Update notification type enum if it was a check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY (ARRAY['general'::text, 'course'::text, 'lesson'::text, 'live'::text, 'feedback'::text]));

-- Function to handle auto-notifications for feedback
CREATE OR REPLACE FUNCTION public.notify_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  item_title TEXT;
BEGIN
  -- Get item title (course or ebook)
  IF NEW.course_id IS NOT NULL THEN
    SELECT title INTO item_title FROM public.courses WHERE id = NEW.course_id;
  ELSE
    SELECT title INTO item_title FROM public.ebooks WHERE id = NEW.ebook_id;
  END IF;

  -- Create notification record for admins
  INSERT INTO public.notifications (
    title,
    message,
    type,
    target_type,
    metadata
  ) VALUES (
    'Novo Feedback Recebido',
    'Um novo feedback foi enviado para o item: ' || COALESCE(item_title, 'Item Desconhecido'),
    'feedback',
    'all',
    jsonb_build_object(
      'feedback_id', NEW.id,
      'item_title', item_title,
      'rating', NEW.rating,
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new feedback
DROP TRIGGER IF EXISTS tr_notify_new_feedback ON public.course_feedback;
CREATE TRIGGER tr_notify_new_feedback
AFTER INSERT ON public.course_feedback
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_feedback();

-- Fix RLS for notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

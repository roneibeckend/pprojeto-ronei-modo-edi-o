CREATE OR REPLACE FUNCTION public.log_unhandled_question_v2(
  p_message text, 
  p_confidence float8, 
  p_context jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.unhandled_questions (question, confidence, context, status)
  VALUES (p_message, p_confidence, p_context, 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_unhandled_question_v2(text, float8, jsonb) TO anon, authenticated;

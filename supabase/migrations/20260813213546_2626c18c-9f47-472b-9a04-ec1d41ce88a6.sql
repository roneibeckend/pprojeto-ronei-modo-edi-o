-- 1. Adicionar coluna de status na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'lead';

-- 2. Criar função de promoção
CREATE OR REPLACE FUNCTION public.promote_to_student()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles 
  SET status = 'student' 
  WHERE id = NEW.user_id 
    AND (status IS NULL OR status = 'lead');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar gatilhos para matrículas de cursos e ebooks
DROP TRIGGER IF EXISTS on_course_enrollment_promote ON public.course_enrollments;
CREATE TRIGGER on_course_enrollment_promote
  AFTER INSERT ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.promote_to_student();

DROP TRIGGER IF EXISTS on_ebook_enrollment_promote ON public.ebook_enrollments;
CREATE TRIGGER on_ebook_enrollment_promote
  AFTER INSERT ON public.ebook_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.promote_to_student();

-- 4. Migrar usuários existentes que já possuem matrícula
UPDATE public.profiles
SET status = 'student'
WHERE id IN (
  SELECT user_id FROM public.course_enrollments
  UNION
  SELECT user_id FROM public.ebook_enrollments
) AND (status IS NULL OR status = 'lead');

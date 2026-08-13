
-- Adição de índices para otimização de consultas frequentes
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_is_locked ON public.courses(is_locked);
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON public.ebooks(status);
CREATE INDEX IF NOT EXISTS idx_ebooks_is_locked ON public.ebooks(is_locked);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_ebook_enrollments_user_id ON public.ebook_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_enrollments_ebook_id ON public.ebook_enrollments(ebook_id);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_ebook_modules_ebook_id ON public.ebook_modules(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_chapters_ebook_id ON public.ebook_chapters(ebook_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id_lesson_id ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_ebook_progress_user_id_chapter_id ON public.ebook_progress(user_id, chapter_id);

GRANT ALL ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;

ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ebook chapters"
ON public.ebook_chapters
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager', 'agent')
  )
);
-- Create Enum for Knowledge Categories
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE public.knowledge_category AS ENUM (
            'CONTA', 'CURSOS', 'EBOOKS', 'MATERIAIS', 'PWA', 'SUPORTE', 'PROBLEMAS'
        );
    END IF;
END $$;

-- Knowledge Base Table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category public.knowledge_category NOT NULL DEFAULT 'SUPORTE',
    questions TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unhandled Questions Table
CREATE TABLE IF NOT EXISTS public.unhandled_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    confidence FLOAT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved, ignored
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Feedback Table
CREATE TABLE IF NOT EXISTS public.knowledge_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_positive BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants
GRANT SELECT ON public.knowledge_base TO authenticated;
GRANT ALL ON public.knowledge_base TO service_role;
GRANT INSERT, SELECT ON public.unhandled_questions TO authenticated;
GRANT ALL ON public.unhandled_questions TO service_role;
GRANT INSERT ON public.knowledge_feedback TO authenticated;
GRANT ALL ON public.knowledge_feedback TO service_role;

-- RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unhandled_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge_base
CREATE POLICY "Anyone can read active knowledge"
ON public.knowledge_base FOR SELECT
TO authenticated
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage knowledge"
ON public.knowledge_base FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for unhandled_questions
CREATE POLICY "Users can insert unhandled"
ON public.unhandled_questions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins view/update unhandled"
ON public.unhandled_questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for knowledge_feedback
CREATE POLICY "Users can insert feedback"
ON public.knowledge_feedback FOR INSERT
TO authenticated
WITH CHECK (true);

-- Initial Knowledge Seeding
INSERT INTO public.knowledge_base (title, content, category, questions, keywords)
VALUES 
(
    'Como baixar e-books', 
    'Para baixar seus e-books, vá em "Meus Cursos", selecione o e-book desejado e clique no botão de download na página de detalhes. Os arquivos estão em formato PDF ou DOCX.', 
    'EBOOKS', 
    ARRAY['como baixo o livro?', 'onde faco download?', 'onde esta meu ebook?', 'como baixar o ebook?'],
    ARRAY['download', 'pdf', 'ebook', 'livro', 'baixar']
),
(
    'Acesso ao curso Do Zero aos 10k', 
    'O curso "Do Zero aos 10k" está disponível na sua área do aluno logo após a confirmação do pagamento. Se você pagou via PIX, o acesso é instantâneo.', 
    'CURSOS', 
    ARRAY['não consigo ver meu curso', 'cadê o curso 10k?', 'comprei e não apareceu'],
    ARRAY['acesso', '10k', 'curso', 'compra', 'pagamento']
),
(
    'Como instalar o App (PWA)', 
    'Você pode instalar nosso app no celular abrindo o site no Chrome (Android) ou Safari (iPhone) e clicando em "Adicionar à tela de início" no menu do navegador.', 
    'PWA', 
    ARRAY['tem aplicativo?', 'como instalo no celular?', 'baixar app'],
    ARRAY['app', 'aplicativo', 'instalar', 'celular', 'pwa']
),
(
    'Esqueci minha senha', 
    'Você pode recuperar sua senha clicando em "Esqueci minha senha" na tela de login. Enviaremos um link de recuperação para o seu e-mail cadastrado.', 
    'CONTA', 
    ARRAY['perdi minha senha', 'não lembro o login', 'trocar senha'],
    ARRAY['senha', 'login', 'recuperar', 'esqueci']
);

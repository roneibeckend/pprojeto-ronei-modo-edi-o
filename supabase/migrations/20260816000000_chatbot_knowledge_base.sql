-- Create app_category enum for knowledge base
DO $$ BEGIN
    CREATE TYPE public.knowledge_category AS ENUM ('CONTA', 'CURSOS', 'EBOOKS', 'MATERIAIS', 'PWA', 'SUPORTE', 'PROBLEMAS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category public.knowledge_category NOT NULL DEFAULT 'SUPORTE',
    questions TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unhandled_questions table for learning
CREATE TABLE IF NOT EXISTS public.unhandled_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    context JSONB DEFAULT '{}',
    confidence FLOAT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create response_feedback table
CREATE TABLE IF NOT EXISTS public.knowledge_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_positive BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unhandled_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.knowledge_base TO authenticated;
GRANT ALL ON public.knowledge_base TO service_role;

GRANT INSERT ON public.unhandled_questions TO authenticated;
GRANT ALL ON public.unhandled_questions TO service_role;

GRANT INSERT ON public.knowledge_feedback TO authenticated;
GRANT ALL ON public.knowledge_feedback TO service_role;

-- Policies for knowledge_base
CREATE POLICY "Anyone authenticated can read active knowledge"
ON public.knowledge_base FOR SELECT
TO authenticated
USING (status = 'active');

CREATE POLICY "Admins can manage knowledge base"
ON public.knowledge_base FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for unhandled_questions
CREATE POLICY "Users can insert their own unhandled questions"
ON public.unhandled_questions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage unhandled questions"
ON public.unhandled_questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for knowledge_feedback
CREATE POLICY "Users can insert feedback"
ON public.knowledge_feedback FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read feedback"
ON public.knowledge_feedback FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Initial Seed Data
INSERT INTO public.knowledge_base (title, content, category, questions, keywords) VALUES
('Como acessar meus cursos', 'Para acessar seus cursos: 1. Clique em "INÍCIO" no menu lateral. 2. Lá você verá a vitrine de cursos. 3. Clique no botão "ACESSAR CONTEÚDO" do curso que você deseja assistir.', 'CURSOS', ARRAY['onde vejo meu curso?', 'cadê as aulas que comprei?', 'como entro no treinamento?', 'não acho meu conteúdo'], ARRAY['acesso', 'curso', 'aulas', 'treinamento']),
('Como baixar E-books', 'Para baixar seus e-books: 1. Vá em "Cursos" no menu. 2. Selecione o E-book desejado. 3. Dentro do leitor de e-book, procure o botão de download ou PDF.', 'EBOOKS', ARRAY['como baixo meu ebook?', 'onde clico para baixar?', 'download pdf'], ARRAY['download', 'pdf', 'ebook', 'baixar']),
('Como instalar o PWA', 'O aplicativo (PWA) permite acesso rápido. 1. No celular (Android/Chrome), clique nos três pontos e selecione "Instalar Aplicativo". 2. No iPhone (Safari), clique em "Compartilhar" e "Adicionar à Tela de Início".', 'PWA', ARRAY['como instalo o app?', 'tem aplicativo?', 'como colocar na tela inicial'], ARRAY['pwa', 'aplicativo', 'app', 'instalar']),
('Alterar Senha', 'Para alterar sua senha: 1. Vá em "Meu Perfil". 2. Clique em "Segurança" ou "Alterar Senha". 3. Siga as instruções na tela.', 'CONTA', ARRAY['como mudo minha senha?', 'esqueci minha senha', 'trocar senha'], ARRAY['senha', 'segurança', 'password', 'mudar']),
('Falar com Suporte', 'Se você não encontrou o que precisava, pode abrir um ticket em "Suporte > Meus Chamados > Abrir Novo Chamado". Nossa equipe responde em até 24h úteis.', 'SUPORTE', ARRAY['como falo com atendente?', 'preciso de ajuda humana', 'falar com suporte'], ARRAY['ajuda', 'suporte', 'humano', 'atendente', 'ticket']);

-- Expandir Base de Conhecimento do Brasa
-- Limpar duplicatas se houver
DELETE FROM public.knowledge_base WHERE title IN (
    'Como instalar o App (PWA)',
    'Esqueci minha senha',
    'Como baixar e-books',
    'Acesso ao curso Do Zero aos 10k'
);

INSERT INTO public.knowledge_base (title, content, category, questions, keywords)
VALUES 
-- ACESSO E CONTA
(
    'Login e Acesso', 
    'Para entrar na plataforma, use seu e-mail e a senha cadastrada na página de login. Se você comprou via Google, use o botão "Continuar com Google".', 
    'CONTA', 
    ARRAY['como faco login?', 'como entrar no site?', 'nao consigo entrar', 'problema no login'],
    ARRAY['login', 'entrar', 'acesso', 'acessar', 'plataforma']
),
(
    'Recuperação de Senha', 
    'Esqueceu sua senha? Na tela de login, clique em "Esqueci minha senha". Você receberá um link de redefinição no seu e-mail.', 
    'CONTA', 
    ARRAY['esqueci minha senha', 'perdi a senha', 'como mudo a senha?', 'nao lembro minha senha'],
    ARRAY['senha', 'recuperar', 'password', 'esqueci', 'trocar']
),
(
    'Gerenciar Perfil', 
    'Você pode alterar seu nome, foto e WhatsApp no menu "Meu Perfil". Lembre-se de salvar as alterações para que seu ranking e certificados fiquem corretos.', 
    'CONTA', 
    ARRAY['mudar minha foto', 'alterar meu nome', 'trocar whatsapp', 'onde mudo meus dados?'],
    ARRAY['perfil', 'dados', 'nome', 'foto', 'avatar', 'whatsapp']
),

-- PWA / INSTALAÇÃO
(
    'Como instalar o App (PWA)', 
    'Nosso app é um PWA. No Android (Chrome), clique nos três pontos e "Instalar Aplicativo". No iPhone (Safari), clique no ícone de compartilhar (quadrado com seta) e "Adicionar à Tela de Início".', 
    'PWA', 
    ARRAY['como instalo o app?', 'tem aplicativo?', 'como baixar no celular?', 'como coloca na tela inicial?', 'instalar no iphone', 'instalar no android'],
    ARRAY['app', 'aplicativo', 'pwa', 'instalar', 'baixar', 'celular', 'iphone', 'android', 'tela']
),

-- CURSOS E CONTEÚDO
(
    'Onde estão meus cursos?', 
    'Todos os cursos e e-books comprados aparecem na aba "Meus Cursos". Se você acabou de comprar, pode levar alguns minutos para o sistema liberar o acesso.', 
    'CURSOS', 
    ARRAY['onde estao meus cursos?', 'cade meu curso?', 'nao acho minhas aulas', 'onde entro no treinamento?', 'comprei e nao apareceu'],
    ARRAY['curso', 'aulas', 'treinamento', 'cade', 'compra', 'acesso', 'liberado']
),
(
    'Aulas e Vídeos', 
    'Para assistir, selecione o curso em "Meus Cursos", abra o módulo e clique na aula. Nossos vídeos são otimizados para 9:16 (vertical). Se o vídeo travar, verifique sua conexão.', 
    'CURSOS', 
    ARRAY['como assisto as aulas?', 'video nao carrega', 'video travando', 'como abre a aula?', 'tem video?'],
    ARRAY['video', 'aula', 'assistir', 'travando', 'carregar', 'player', 'mudar aula']
),
(
    'Receitas Espetinho na Veia', 
    'Acesse a aba "Receitas" no menu lateral. Lá você encontra preparo, ingredientes, custo e margem de lucro estimada para cada tipo de espetinho.', 
    'CURSOS', 
    ARRAY['onde estao as receitas?', 'como faco o espetinho?', 'receita de carne', 'tem tempero?'],
    ARRAY['receita', 'preparo', 'ingrediente', 'custo', 'lucro', 'tempero', 'carne', 'frango']
),
(
    'Aulas ao Vivo', 
    'As aulas ao vivo são anunciadas no menu "Ao Vivo". Lá você verá o link para a transmissão no dia e horário agendados. Fique atento às notificações!', 
    'CURSOS', 
    ARRAY['quando tem aula ao vivo?', 'onde vejo a live?', 'vai ter aula hoje?', 'horario da aula'],
    ARRAY['live', 'vivo', 'transmissão', 'horario', 'data', 'agendado']
),

-- EBOOKS E MATERIAIS
(
    'Como baixar E-books', 
    'Vá em "Meus Cursos", selecione o E-book e clique no botão de download. Você pode ler diretamente no celular ou computador em formato PDF.', 
    'EBOOKS', 
    ARRAY['como baixo o ebook?', 'onde faco download do livro?', 'baixar pdf do curso', 'nao consigo baixar o ebook'],
    ARRAY['ebook', 'livro', 'pdf', 'download', 'baixar', 'ler']
),
(
    'Planilhas e Recursos', 
    'No menu "Recursos", você encontra planilhas de custo, calculadoras de preço, checklists e artes para divulgação prontas para uso.', 
    'MATERIAIS', 
    ARRAY['onde estao as planilhas?', 'cade os materiais?', 'planilha de custos', 'artes para divulgar'],
    ARRAY['planilha', 'custos', 'calculadora', 'checklist', 'arte', 'material', 'recurso']
),

-- SISTEMAS ESPECÍFICOS
(
    'Ranking e Pontuação', 
    'O Ranking premia os alunos que concluem aulas. Você ganha pontos ao finalizar módulos e cursos. Conclusões rápidas (em até 24h/48h) dão bônus extras!', 
    'CURSOS', 
    ARRAY['como funciona o ranking?', 'como ganho pontos?', 'pra que serve a pontuacao?', 'sou o primeiro?'],
    ARRAY['ranking', 'pontos', 'pontuacao', 'ganhar', 'estudar', 'concluir']
),
(
    'Certificados Digitais', 
    'Ao concluir 100% de um curso ou e-book, seu certificado oficial será gerado automaticamente. Você pode visualizá-lo e baixá-lo na aba "Certificados".', 
    'CONTA', 
    ARRAY['como pego meu certificado?', 'quando libera o diploma?', 'onde baixo o certificado?', 'onde vejo meus certificados?'],
    ARRAY['certificado', 'diploma', 'conclusao', 'emitir', 'baixar', 'finalizar']
),
(
    'Suporte e Chamados', 
    'Precisa de ajuda humana? Vá em "Suporte", escolha a aba "Meus Chamados" e clique em "Abrir Novo Chamado". Nossa equipe responde em até 24h úteis.', 
    'SUPORTE', 
    ARRAY['falar com atendente', 'abrir chamado', 'falar com suporte', 'ajuda humana', 'cade o ronnei?'],
    ARRAY['suporte', 'chamado', 'atendimento', 'humano', 'ajuda', 'ticket']
),
(
    'Programa de Afiliados', 
    'Você pode ganhar comissões indicando nossos cursos! Acesse o menu "Afiliados" para solicitar seu cadastro, pegar seus links e acompanhar seus ganhos.', 
    'CONTA', 
    ARRAY['como sou afiliado?', 'quero vender o curso', 'onde pego meu link?', 'como ganho comissao?'],
    ARRAY['afiliado', 'venda', 'comissao', 'link', 'indicar', 'indicação', 'ganhar']
);
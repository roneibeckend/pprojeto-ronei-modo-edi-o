
-- Inserindo novas FAQs na base de conhecimento
INSERT INTO public.knowledge_base (title, content, category, questions, keywords, status)
VALUES 
-- Afiliados
('Como funciona o Programa de Afiliados?', 'Nosso programa permite que você ganhe comissões indicando nossos produtos. Após solicitar afiliação no menu \"Afiliados\", você recebe links exclusivos. Cada venda feita pelo seu link gera uma comissão automática em seu saldo.', 'CONTA', ARRAY['como funciona afiliados', 'como ser afiliado', 'como vender curso', 'quero ser parceiro', 'ganhar dinheiro indicando'], ARRAY['comissao', 'link', 'venda', 'indicação', 'afiliado', 'parceiro'], 'active'),

('Qual a porcentagem de comissão?', 'As comissões variam de acordo com o produto, geralmente entre 30% a 50% do valor líquido da venda. Você pode conferir a taxa exata de cada produto na aba \"Produtos Disponíveis\" dentro do menu de Afiliados.', 'CONTA', ARRAY['qual a comissao', 'quanto ganho por venda', 'porcentagem afiliado', 'valor da comissao'], ARRAY['porcentagem', 'lucro', 'valor', 'taxa', 'ganho'], 'active'),

('Como recebo minhas comissões?', 'Os pagamentos são realizados via Pix. Quando você atingir o saldo mínimo, pode solicitar o saque na aba \"Financeiro\" do menu Afiliados. O processamento ocorre em até 3 dias úteis após a conferência da venda.', 'CONTA', ARRAY['como recebo meu dinheiro', 'sacar comissao', 'pagamento pix afiliados', 'quando recebo'], ARRAY['pix', 'saque', 'pagamento', 'transferencia', 'dinheiro'], 'active'),

-- Financeiro
('Quais as formas de pagamento aceitas?', 'Aceitamos Pix (liberação imediata), Cartão de Crédito (parcelamento em até 12x) e Boleto Bancário (liberação em até 48h úteis). Todas as transações são processadas com segurança pelo Asaas.', 'SUPORTE', ARRAY['formas de pagamento', 'aceita cartao', 'parcelamento', 'boleto', 'pagar com pix'], ARRAY['pagamento', 'cartao', 'pix', 'boleto', 'parcela', 'asaas'], 'active'),

('Minha compra foi aprovada, mas não vejo o curso.', 'Compras via Pix e Cartão costumam liberar em minutos. Se o curso não aparecer em \"Meus Cursos\", tente sair e entrar novamente na conta. Se persistir após 30 minutos, abra um chamado no Suporte anexando o comprovante.', 'PROBLEMAS', ARRAY['curso nao apareceu', 'nao liberou o curso', 'ja paguei e nada', 'problema na liberação'], ARRAY['liberação', 'acesso', 'atraso', 'comprovante', 'pendente'], 'active'),

('Como solicitar reembolso?', 'Conforme o Código de Defesa do Consumidor, você tem até 7 dias após a compra para solicitar o reembolso total. Basta abrir um chamado no menu \"Suporte\" com o motivo da desistência e os dados da compra.', 'SUPORTE', ARRAY['quero reembolso', 'devolucao do dinheiro', 'cancelar compra', 'estorno'], ARRAY['reembolso', 'cancelamento', 'estorno', 'dinheiro', 'desistencia'], 'active'),

-- Cursos & Ebooks
('Os cursos têm prazo de acesso?', 'A maioria dos nossos cursos oferece acesso vitalício ou por 1 ano, dependendo da oferta no momento da compra. Você pode consultar a validade do seu acesso nos detalhes do curso em \"Meus Cursos\".', 'CURSOS', ARRAY['tempo de acesso', 'acesso vitalicio', 'validade do curso', 'ate quando posso assistir'], ARRAY['validade', 'prazo', 'expira', 'vitalicio', 'tempo'], 'active'),

('Posso assistir as aulas offline?', 'Atualmente as aulas exigem conexão com a internet para reprodução. No entanto, os materiais de apoio e E-books em PDF podem ser baixados para leitura e consulta offline a qualquer momento.', 'CURSOS', ARRAY['assistir offline', 'baixar video', 'ver sem internet', 'download aulas'], ARRAY['offline', 'internet', 'conexão', 'baixar', 'video'], 'active'),

('Como participar do Grupo de Alunos?', 'O link para o grupo exclusivo do WhatsApp fica disponível dentro do módulo de \"Boas-vindas\" ou \"Comunidade\" do seu curso. Se você adquiriu o Grupo Exclusivo separadamente, ele aparecerá como um item em \"Meus Cursos\".', 'CURSOS', ARRAY['grupo whatsapp', 'entrar na comunidade', 'link do grupo', 'networking alunos'], ARRAY['whatsapp', 'grupo', 'comunidade', 'networking', 'alunos'], 'active'),

-- PWA
('O app ocupa muito espaço no celular?', 'Não! Como somos um PWA (Progressive Web App), o aplicativo funciona como uma versão otimizada do site e ocupa pouquíssimo espaço, pois não exige o download de pacotes pesados das lojas oficiais.', 'PWA', ARRAY['espaco no celular', 'tamanho do app', 'memoria cheia', 'peso do aplicativo'], ARRAY['espaco', 'memoria', 'armazenamento', 'leve', 'pwa'], 'active'),

('Como atualizar o aplicativo?', 'O PWA se atualiza automaticamente sempre que você o abre com conexão à internet. Se notar algo desatualizado, feche o app completamente e abra-o novamente.', 'PWA', ARRAY['atualizar app', 'nova versao', 'bug no aplicativo', 'reinstalar'], ARRAY['atualização', 'versao', 'update', 'reinstalar', 'cache'], 'active'),

-- Geral
('O site é seguro?', 'Sim! Utilizamos certificados SSL de alta segurança e processamento de pagamentos criptografado. Seus dados pessoais e bancários estão protegidos seguindo a LGPD (Lei Geral de Proteção de Dados).', 'SUPORTE', ARRAY['site e seguro', 'dados protegidos', 'seguranca dos dados', 'e confiavel'], ARRAY['seguro', 'confiavel', 'criptografia', 'protegido', 'lgpd'], 'active'),

('Posso compartilhar minha conta?', 'O acesso é individual e intransferível. O sistema monitora acessos simultâneos de diferentes localizações; acessos indevidos podem causar o bloqueio automático da conta por segurança.', 'CONTA', ARRAY['dividir conta', 'compartilhar senha', 'acesso simultaneo', 'mais de uma pessoa'], ARRAY['compartilhar', 'senha', 'bloqueio', 'segurança', 'individual'], 'active');


-- 1. Inserir perguntas da Landing Page na base de conhecimento (se não existirem)
INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'Garantia do eBook', 'SUPORTE', 'Você tem 7 dias de garantia total. Se não gostar, basta pedir o reembolso e devolvemos 100% do valor. Sem perguntas.', ARRAY['E se eu não gostar do material?', 'garantia ebook', 'reembolso', 'devolução'], ARRAY['garantia', 'reembolso', 'dinheiro de volta', 'risco zero', 'desistir'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'Garantia do eBook');

INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'Recuperação do Investimento', 'SUPORTE', 'Seguindo o plano de ação, muitos alunos recuperam o valor do eBook nas primeiras vendas — geralmente já na primeira semana.', ARRAY['Em quanto tempo recupero o investimento?', 'lucro rápido', 'recuperar dinheiro'], ARRAY['investimento', 'dinheiro', 'retorno', 'prazo', 'recuperar'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'Recuperação do Investimento');

INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'Experiência com Churrasco', 'CURSOS', 'Não. O método foi pensado para iniciantes absolutos. Você é guiado passo a passo desde a escolha da carne até a venda.', ARRAY['Preciso ter experiência com churrasco?', 'sou iniciante', 'não sei fazer churrasco'], ARRAY['experiencia', 'iniciante', 'começar do zero', 'aprender', 'churrasco'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'Experiência com Churrasco');

INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'Cidade Pequena ou Interior', 'SUPORTE', 'As estratégias funcionam em qualquer região — cidade grande, interior, bairro residencial ou comercial.', ARRAY['E se eu morar em cidade pequena?', 'funciona no interior?', 'cidade pequena'], ARRAY['regiao', 'cidade', 'interior', 'local', 'onde abrir'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'Cidade Pequena ou Interior');

INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'Venda por Delivery', 'CURSOS', 'Sim. Tem estratégias específicas para venda por WhatsApp, iFood e delivery próprio, além do ponto físico.', ARRAY['Funciona também para delivery?', 'posso vender pelo whatsapp?', 'vender no ifood'], ARRAY['delivery', 'entregas', 'whatsapp', 'ifood', 'online'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'Venda por Delivery');

INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'Acesso ao Material', 'EBOOKS', 'O acesso é liberado automaticamente por e-mail em minutos, após a confirmação do pagamento. Você lê no celular, tablet ou computador.', ARRAY['Como recebo o material?', 'onde baixo o ebook?', 'receber curso'], ARRAY['acesso', 'email', 'login', 'baixar', 'onde está'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'Acesso ao Material');

INSERT INTO public.knowledge_base (title, category, content, questions, keywords, status)
SELECT 'O que é o Brasa?', 'SUPORTE', 'O Brasa (ou Ronnei na Veia) é um método completo do zero aos 10k focado em espetinhos premium. Inclui eBook, planilhas, bônus e suporte para você montar seu próprio negócio lucrativo.', ARRAY['O que é o Brasa?', 'o que é ronnei na veia?', 'quem é ronnei?'], ARRAY['brasa', 'produto', 'curso', 'ebook', 'metodo'], 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.knowledge_base WHERE title = 'O que é o Brasa?');

-- 2. Garantir permissões
GRANT SELECT ON public.knowledge_base TO anon;
GRANT SELECT ON public.knowledge_base TO authenticated;
GRANT INSERT ON public.unhandled_questions TO anon;
GRANT INSERT ON public.unhandled_questions TO authenticated;
GRANT SELECT ON public.unhandled_questions TO authenticated;

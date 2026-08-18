-- Atualizar a resposta de Certificados
UPDATE public.knowledge_base
SET 
  content = 'Para gerar seu certificado, acesse a área "Meus Cursos", clique no curso concluído e localize a opção "Gerar Certificado". Certifique-se de ter completado 100% de todos os módulos e aulas.',
  keywords = array_cat(keywords, ARRAY['gerar', 'como gero', 'concluir', 'passo a passo']),
  questions = array_cat(questions, ARRAY['como gero certificado?', 'como emitir certificado?', 'passo a passo certificado'])
WHERE title = 'Certificados Digitais';

-- Atualizar a resposta de Planilhas e Materiais
UPDATE public.knowledge_base
SET 
  content = 'Seus materiais em PDF, como planilhas e recursos adicionais, podem ser encontrados dentro de cada curso na seção de "Materiais" ou "Recursos". Se for um e-book, ele também estará disponível em "Meus Cursos".',
  keywords = array_cat(keywords, ARRAY['pdf', 'onde acho', 'onde fica', 'complementar']),
  questions = array_cat(questions, ARRAY['onde acho meu material em pdf?', 'cade as planilhas?', 'onde estao os materiais?', 'material complementar'])
WHERE title = 'Planilhas e Recursos';

-- Refinar PWA
UPDATE public.knowledge_base
SET 
  keywords = array_remove(keywords, 'baixar'),
  questions = array_cat(questions, ARRAY['instalar no celular', 'como ter o app'])
WHERE title = 'Como instalar o App (PWA)';

-- Limpeza de duplicados
UPDATE public.knowledge_base 
SET 
  keywords = (SELECT array_agg(DISTINCT x) FROM unnest(keywords) AS x),
  questions = (SELECT array_agg(DISTINCT x) FROM unnest(questions) AS x)
WHERE status = 'active';

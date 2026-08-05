REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_ticket_timestamp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;-- 1. Limpeza de dados antigos para evitar duplicidade ou conflitos
TRUNCATE public.course_enrollments CASCADE;
TRUNCATE public.lesson_progress CASCADE;
TRUNCATE public.lessons CASCADE;
TRUNCATE public.modules CASCADE;
TRUNCATE public.courses CASCADE;
TRUNCATE public.ebooks CASCADE;
TRUNCATE public.recipes CASCADE;

-- 2. CURSOS (Espetinho do Ronnei)
INSERT INTO public.courses (id, title, description, teacher_name, price, is_locked, badge, order_index)
VALUES 
('espetinho-lucrativo', 'Espetinho Lucrativo (Do Zero aos 10k)', 'O método definitivo para montar seu negócio de espetinhos, desde a escolha da carne até a estratégia de vendas para atingir R$ 10.000,00 de faturamento mensal.', 'Ronnei', 147.00, false, 'BEST SELLER', 1),
('molhos-acompanhamentos', 'Mestre dos Molhos e Acompanhamentos', 'Aprenda as receitas secretas de molhos, farofas e guarnições que fazem o cliente viciar no seu espetinho e aumentam seu ticket médio.', 'Ronnei', 47.90, true, 'ESSENCIAL', 2),
('vender-mais', 'Vendas e Marketing para Espetinhos', 'Estratégias avançadas de divulgação no Instagram, WhatsApp e iFood para manter sua churrasqueira sempre cheia e pedidos bombando.', 'Ronnei', 67.00, true, 'MARKETING', 3),
('gestao-negocio', 'Gestão Financeira e Estoque', 'Como organizar suas contas, calcular lucro real, separar CPF de CNPJ e nunca perder dinheiro por falta de controle.', 'Ronnei', 97.00, true, 'GESTÃO', 4);

-- 3. MÓDULOS (Para o curso principal)
INSERT INTO public.modules (id, course_id, title, order_index)
VALUES 
('m1-lucrativo', 'espetinho-lucrativo', 'Módulo 1: Mentalidade e Planejamento', 1),
('m2-lucrativo', 'espetinho-lucrativo', 'Módulo 2: O Segredo das Carnes', 2),
('m3-lucrativo', 'espetinho-lucrativo', 'Módulo 3: Produção e Montagem', 3),
('m4-lucrativo', 'espetinho-lucrativo', 'Módulo 4: Brasa e Ponto Perfeito', 4),
('m5-lucrativo', 'espetinho-lucrativo', 'Módulo 5: Estratégias de Venda', 5);

-- 4. AULAS (Exemplos reais baseados no conteúdo do Ronnei)
INSERT INTO public.lessons (id, module_id, title, duration, video_url, order_index, is_locked)
VALUES 
('l1-m1', 'm1-lucrativo', 'Boas-vindas e como aproveitar o curso', '05:00', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, false),
('l2-m1', 'm1-lucrativo', 'O mercado de espetinhos em 2026', '12:00', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2, false),
('l1-m2', 'm2-lucrativo', 'As 5 melhores carnes (Custo x Benefício)', '15:30', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, false),
('l2-m2', 'm2-lucrativo', 'Limpeza e corte padrão (Sem desperdício)', '22:15', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2, false),
('l1-m3', 'm3-lucrativo', 'Montagem do espetinho padrão (Pesagem)', '10:45', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, false),
('l2-m3', 'm3-lucrativo', 'Temperos secos vs Temperos líquidos', '18:20', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2, false);

-- 5. E-BOOKS
INSERT INTO public.ebooks (id, title, description, category, pages_count, price, original_price, is_locked)
VALUES 
('ebook-10k', 'Espetinho na Veia: O Guia dos 10k', 'O livro digital que detalha toda a jornada do Ronnei, com tabelas de custos e roteiros de vendas.', 'Negócio', 84, 47.90, 97.00, false),
('ebook-receitas', '50 Receitas de Espetinhos Irresistíveis', 'Um compilado das receitas mais vendidas, desde os clássicos até os gourmet.', 'Receitas', 62, 27.90, 47.00, false),
('ebook-molhos', 'Molhos Artesanais que Vendem', 'Aprenda a fazer o molho verde secreto e a farofa crocante.', 'Receitas', 40, 19.90, 37.00, true);

-- 6. RECEITAS
INSERT INTO public.recipes (id, name, category, prep_time, yield, difficulty, cost, sell_price, profit_margin, ingredients, steps)
VALUES 
('rec-alcatra', 'Alcatra com Alho Especial', 'Carne bovina', '40 min', '10 espetos', 'Fácil', 'R$ 3,50', 'R$ 12,00', '242%', ARRAY['1kg de Alcatra', '3 dentes de alho amassados', 'Sal grosso', 'Azeite'], ARRAY['Corte a carne em cubos de 3cm', 'Misture o alho com azeite', 'Envolva a carne na mistura', 'Asse em brasa forte por 8 min']),
('rec-frango', 'Frango com Bacon (Medalhão)', 'Frango', '50 min', '12 espetos', 'Médio', 'R$ 2,80', 'R$ 10,00', '257%', ARRAY['Peito de frango', 'Bacon fatiado', 'Páprica defumada'], ARRAY['Corte o frango em cubos', 'Envolva cada cubo com meia fatia de bacon', 'Prenda no espeto', 'Asse em brasa média para o bacon não queimar']);

-- 7. MATRÍCULAS INICIAIS (Para o usuário logado ter acesso ao curso principal)
-- O script de migração deve lidar com auth.uid(), mas aqui injetamos o curso como não-bloqueado via 'is_locked = false' acima.

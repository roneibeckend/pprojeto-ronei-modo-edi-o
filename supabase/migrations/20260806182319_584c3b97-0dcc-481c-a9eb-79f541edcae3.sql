-- Seed Courses
INSERT INTO public.courses (id, title, description, cover_url, teacher_name, price, is_locked, badge)
VALUES 
('do-zero-aos-10k', 'Do Zero aos 10k: O Guia Completo do Espetinho', 'O treinamento definitivo para transformar espetinhos em uma fonte de renda de R$ 10.000 por mês.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/hero-chef.asset.json', 'Ronnei — Espetos Grill', 0, false, 'O MAIS VENDIDO'),
('espetinho-lucrativo-advanced', 'Espetinho Lucrativo: Técnicas Avançadas', 'Domine cortes nobres, temperos secretos e a arte da brasa perfeita para cobrar mais caro.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/platter1.asset.json', 'Ronnei — Espetos Grill', 97.0, false, NULL),
('molhos-acompanhamentos-v2', 'Mestres dos Molhos e Acompanhamentos', 'As receitas que fazem o cliente voltar toda semana e aumentam seu lucro em 40%.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/platter2.asset.json', 'Equipe Espetinho na Veia', 47.9, true, NULL),
('vendas-marketing-espeto', 'Máquina de Vendas: Do Zero ao Sucesso no Digital', 'Como usar o Instagram e WhatsApp para lotar seu ponto de venda todos os dias.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/chef-working.asset.json', 'Equipe Espetinho na Veia', 67.0, true, NULL);

-- Seed Ebooks
INSERT INTO public.ebooks (id, title, description, cover_url, pages_count, category, price, original_price, is_locked)
VALUES
('guia-completo', 'Guia Completo do Espetinho Lucrativo', 'O passo a passo do zero aos 10k por mês.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/hero-chef.asset.json', 84, 'Negócio', 0, 0, false),
('50-receitas', '50 Receitas de Espetinhos', 'Variedade que fideliza clientes.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/platter1.asset.json', 62, 'Receitas', 0, 0, false),
('molhos-vendem', 'Molhos que Vendem', 'Aumente o ticket médio com molhos irresistíveis.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/platter2.asset.json', 40, 'Receitas', 27.9, 47.9, true),
('manual-temperos', 'Manual de Temperos', 'Combinações profissionais e proporções ideais.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/ribeye.asset.json', 36, 'Técnica', 0, 0, false),
('custos-lucros', 'Como Calcular Custos e Lucros', 'Fórmulas e planilhas prontas.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/chef-working.asset.json', 28, 'Gestão', 0, 0, false),
('divulgacao', 'Guia de Divulgação para Espetinhos', 'Do Instagram ao boca a boca.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/skewers-flat.asset.json', 44, 'Marketing', 19.9, 37.0, true),
('checklist-abrir', 'Checklist para Abrir seu Negócio', 'Não esqueça de nada antes da primeira venda.', 'https://id-preview--bb5e6b8f-a34f-479a-9d94-735aadd89f46.lovable.app/assets/skewers-held.asset.json', 18, 'Negócio', 14.9, 27.0, true);

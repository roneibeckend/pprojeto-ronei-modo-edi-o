-- Altera a coluna ID para TEXT temporariamente para suportar IDs legados ou apenas insere novos UUIDs
-- No entanto, para manter a compatibilidade com a interface administrativa que gerencia UUIDs,
-- o melhor é manter UUID e usar novos registros.

INSERT INTO public.platform_materials (title, description, type, is_active)
VALUES 
  ('Planilha de custos', 'Ferramenta profissional para descobrir o custo real e margem de cada produto.', 'XLSX', true),
  ('Calculadora de preço', 'Sistema inteligente de formação de preço considerando taxas, impostos e lucro.', 'XLSX', true),
  ('Controle de estoque', 'Gestão inteligente com alertas visuais de reposição e estoque mínimo.', 'XLSX', true),
  ('Lista de compras semanal', 'Modelo profissional organizado por categorias para otimizar suas compras.', 'PDF', true),
  ('Checklist de equipamentos', 'Guia completo de tudo que você precisa para montar uma operação profissional.', 'PDF', true),
  ('Cardápio editável', 'Design profissional e editável no PowerPoint ou Canva para atrair mais clientes.', 'PPTX', true),
  ('Artes para divulgação', 'Pack de artes profissionais prontas para Instagram e WhatsApp.', 'ZIP', true),
  ('Controle de vendas', 'Acompanhe seu faturamento diário e desempenho financeiro.', 'XLSX', true);

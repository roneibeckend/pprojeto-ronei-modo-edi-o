# Plano: Expansão da Gestão de Afiliados

Este plano descreve as melhorias na área de Gestão de Afiliados para administradores e a experiência dos afiliados no `/app`.

## Funcionalidades Propostas

### 1. Sistema de Comissão Multinível (2 Níveis)
- Permitir que afiliados indiquem outros afiliados e ganhem uma porcentagem sobre as vendas deles (ex: 5% sobre o valor da venda do indicado).
- **Impacto no Banco de Dados**: Adicionar coluna `referrer_id` na tabela `affiliates`.
- **Lógica de Venda**: Ao processar uma venda, verificar se o afiliado possui um padrinho e gerar a comissão de 2º nível.

### 2. Ferramentas de Marketing (Materiais de Apoio)
- Criar uma nova tabela `affiliate_materials` para armazenar links de criativos (imagens, vídeos, copy) que o administrador disponibiliza.
- **Área do Afiliado**: Nova aba "Materiais" em `/app/afiliados/materiais`.
- **Área Admin**: Interface em `/admin/afiliados/materiais` para gerenciar esses arquivos.

### 3. Relatórios Detalhados e Analytics
- Gráfico de desempenho (cliques vs. vendas) nos últimos 30 dias.
- Filtros por curso/produto nas estatísticas do afiliado.
- Exportação de relatório de vendas em CSV para o administrador.

### 4. Gestão Avançada no Admin
- Histórico de logs de mudança de status de afiliados.
- Possibilidade de definir comissões específicas por curso para um afiliado (sobrescrevendo a taxa global).

## Fluxo de Trabalho

### Para o Administrador
1. Acessa `/admin/afiliados`.
2. Pode visualizar a rede de indicações de um afiliado.
3. Faz upload de novos banners e vídeos na aba de Materiais.
4. Ajusta comissões personalizadas em uma nova seção de detalhes do afiliado.

### Para o Afiliado
1. Acessa `/app/afiliados/links`.
2. Visualiza seu link de indicação para novos afiliados.
3. Navega até "Materiais" para baixar artes prontas para stories/posts.
4. No Dashboard, vê o detalhamento de ganhos diretos vs. ganhos por indicação.

## Etapas de Implementação

1. **Migração de Banco de Dados**:
   - `ALTER TABLE affiliates ADD COLUMN referrer_id UUID REFERENCES affiliates(id)`.
   - `CREATE TABLE affiliate_materials (...)`.
   - `CREATE TABLE affiliate_custom_commissions (...)`.
2. **Backend (Server Functions)**:
   - Atualizar lógica de processamento de comissão para suportar multinível.
   - Criar funções CRUD para materiais de marketing.
3. **Frontend Admin**:
   - Implementar abas e novos filtros em `/admin/afiliados`.
   - Criar interface de upload de materiais.
4. **Frontend Afiliado**:
   - Adicionar aba de materiais em `/app/afiliados`.
   - Atualizar dashboard com estatísticas de rede.

Este plano visa transformar o sistema básico atual em uma ferramenta profissional de crescimento orgânico.
# Plano de Correção e Melhoria da Área Administrativa

Este plano detalha as ações necessárias para corrigir as falhas relatadas na área administrativa, com foco especial no módulo de integrações e na estabilidade geral do sistema de gestão.

## 1. Infraestrutura e Banco de Dados

*   **Migração de Dados**: Criar uma migração para popular a tabela `public.integrations` com os provedores padrão (OpenAI, Google Gemini, Anthropic, Stripe, Mercado Pago, Asaas).
*   **Segurança (RLS)**: Validar se as políticas de RLS e os `GRANT`s na tabela `integrations` permitem apenas acesso administrativo.
*   **Ajuste de Tipos**: Garantir que a estrutura da tabela suporte o armazenamento seguro de credenciais (JSONB).

## 2. Centralização da Área Administrativa

*   **Unificação de Rotas**: Mover o módulo de integrações de `/app/admin/integracoes` para `/admin/integracoes`, consolidando-o dentro do painel administrativo standalone.
*   **Navegação**: Atualizar o componente `Shell` administrativo (`src/routes/admin.tsx`) para incluir o link direto para "Integrações" com o ícone apropriado.

## 3. Implementação Funcional do Módulo de Integrações

*   **Interface Reativa**: Refatorar `src/routes/admin.integracoes.tsx` para substituir os dados estáticos por consultas reais ao banco de dados via TanStack Query.
*   **Gerenciamento de Credenciais**:
    *   Implementar modal de edição para configurar API Keys, Base URLs e outras definições técnicas.
    *   Adicionar toggle de ativação/desativação funcional que persiste no banco.
*   **Validação em Tempo Real**:
    *   Integrar o botão de "Testar Conexão" com as server functions existentes (`testAIConnection`).
    *   Adicionar feedbacks visuais (loaders e toasts) para operações de salvamento e teste.

## 4. Estabilização dos Módulos de Conteúdo (Cursos, E-books, Receitas)

*   **Auditoria de CRUD**: Verificar se todos os campos nos formulários de edição (ex: professor em cursos, páginas em e-books, ingredientes em receitas) estão sendo salvos corretamente.
*   **Tratamento de Erros**: Melhorar a captura de exceções e exibição de mensagens de erro amigáveis durante falhas de rede ou banco de dados.
*   **Estado de Carregamento**: Padronizar os skeletons e loaders em todas as listagens administrativas.

## 5. Testes e Validação

*   **Fluxo de Autenticação**: Validar se usuários não-admins são corretamente redirecionados para fora da área `/admin`.
*   **Persistência**: Confirmar se as alterações em integrações e conteúdos permanecem após o recarregamento da página.
*   **Integridade de Dados**: Verificar se a exclusão de conteúdos remove corretamente as referências associadas.

## Resultado Esperado

Um painel administrativo coeso e totalmente operacional, onde o administrador pode gerenciar o catálogo de conteúdos e configurar as conexões do sistema sem erros de interface ou falhas de persistência.

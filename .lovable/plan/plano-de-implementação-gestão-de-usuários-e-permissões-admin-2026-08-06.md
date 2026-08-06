# Plano de Implementação: Gestão de Usuários e Permissões Administrativas

Este plano detalha a criação de um sistema de controle de acesso para colaboradores (Gerentes e Atendentes), permitindo que o administrador principal gerencie quem pode acessar as áreas de Suporte e Gestão de Alunos.

## 1. Alterações no Banco de Dados (Lovable Cloud)

*   **Novas Roles**: Adicionar `manager` e `agent` ao enum `app_role`.
*   **Tabela `admin_permissions`**:
    *   `id` (uuid, PK)
    *   `user_id` (uuid, FK para `profiles`)
    *   `module` (text: 'suporte', 'alunos')
    *   `can_access` (boolean)
*   **Políticas de Segurança (RLS)**:
    *   Garantir que apenas `admin` possa gerenciar essas permissões.
    *   Atualizar políticas existentes nas tabelas de suporte e perfis para permitir acesso baseado nas novas roles e permissões.

## 2. Backend e Segurança

*   **Middleware de Auth**: Atualizar `use-auth.ts` para detectar as novas roles.
*   **Função SQL `has_module_access`**: Criar uma função de segurança para verificar se um usuário tem permissão para um módulo específico no servidor.

## 3. Interface Administrativa (`/admin/usuarios`)

*   **Nova Rota**: Criar `src/routes/admin.usuarios.tsx`.
*   **Listagem**: Tabela com usuários administrativos (excluindo alunos comuns).
*   **Formulário de Criação/Edição**:
    *   Dados básicos (Nome, Email).
    *   Seleção de Perfil (Gerente, Atendente).
    *   Painel de Permissões: Checkboxes para "Suporte" e "Gestão de Alunos".
*   **Ação de Convite**: Integração com Supabase Auth para convidar novos colaboradores via email.

## 4. Controle de Acesso no Frontend

*   **Sidebar**: Atualizar `Shell.tsx` para mostrar apenas os menus permitidos para o usuário logado.
*   **Route Guards**: Bloquear o acesso direto via URL às páginas de admin caso o usuário não tenha a role ou permissão necessária.

## 5. Validação e Testes

*   Simular login com conta de "Atendente" e verificar se o menu de "Financeiro" ou "Cursos" (não solicitados para este perfil) fica oculto.
*   Garantir que as permissões salvas sejam aplicadas imediatamente.

---
**Observação**: Conforme solicitado, o sistema focará em perfis fixos, mas com a flexibilidade de habilitar os módulos de Suporte e Gestão de Alunos individualmente.

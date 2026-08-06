# Plano de Auditoria e Correção da Área Administrativa

Este plano detalha as etapas para auditar, identificar e corrigir falhas na área administrativa da plataforma, garantindo a integridade dos fluxos de gestão de cursos, e-books, alunos e integrações.

## 1. Auditoria de Rotas e Navegação
- [ ] Verificar todas as rotas em `src/routes/admin.*.tsx`.
- [ ] Validar a proteção de rotas (middleware e `useAuth`) para garantir que apenas administradores acessem `/admin/*`.
- [ ] Testar a consistência do sidebar em `src/routes/admin.tsx`.

## 2. Gestão de Conteúdo (CRUD)
- [ ] **Cursos:** Testar criação, edição e exclusão. Verificar se campos como `cover_url`, `teacher_name` e `is_locked` estão persistindo corretamente no banco através de `saveContent`.
- [ ] **E-books:** Validar se `pages_count`, `category` e `original_price` estão sendo salvos e exibidos.
- [ ] **Receitas:** Testar o formulário completo em `src/routes/admin.receitas.tsx`, incluindo custos e preços.

## 3. Gestão de Alunos e Matrículas
- [ ] Auditar `src/routes/admin.alunos.tsx`.
- [ ] Testar a funcionalidade de edição de perfil e exclusão de aluno.
- [ ] Verificar se a listagem de progresso dos alunos reflete os dados reais das tabelas de `enrollments` e `course_progress`.

## 4. Hub de Integrações
- [ ] Validar a nova rota `/admin/integracoes`.
- [ ] Testar a persistência das credenciais (API Keys) e configurações.
- [ ] Verificar o funcionamento do `testConnectionFn` (Server Function) para OpenAI, Gemini e Stripe.
- [ ] Garantir que o toggle de status (On/Off) atualize o banco de dados em tempo real.

## 5. Fluxos de Trabalho e Integridade de Dados
- [ ] Testar fluxo completo: Criar curso -> Verificar visibilidade na Vitrine -> Atribuir acesso a um aluno -> Validar progresso.
- [ ] Verificar se exclusões de cursos/e-books tratam corretamente as matrículas vinculadas (cascateamento ou restrição).
- [ ] Validar os loaders e estados de erro em todas as telas administrativas para evitar telas brancas (crashes).

## 6. UX e Usabilidade
- [ ] Padronizar feedback visual (Toasts de sucesso/erro).
- [ ] Verificar responsividade das tabelas e modais administrativos.
- [ ] Corrigir eventuais inconsistências de cores/tokens em conformidade com o novo design system.

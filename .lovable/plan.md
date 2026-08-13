# Plano de Correção: Sincronização de Exclusão de Conteúdo

Este plano visa garantir que a exclusão de um curso ou e-book remova automaticamente todas as suas referências na prateleira do aluno (matrículas) e registros de progresso, evitando dados órfãos e inconsistências.

## Alterações Propostas

### 1. Banco de Dados (Supabase)
Adição de triggers ou atualização de restrições de chave estrangeira (`ON DELETE CASCADE`) para as tabelas de matrículas e progresso. Isso garante que a exclusão no nível do banco seja propagada automaticamente, independente de onde o comando de exclusão venha.

*   **Tabelas Afetadas:**
    *   `course_enrollments` (matrículas de cursos)
    *   `ebook_enrollments` (matrículas de e-books)
    *   `course_modules` / `course_lessons` (já possuem FK, mas validaremos o cascateamento)
    *   `ebook_modules` / `ebook_chapters` (já possuem FK, mas validaremos o cascateamento)
    *   `lesson_progress` / `ebook_progress` (devem ser limpos ao excluir o curso/e-book pai)

### 2. Frontend (Administrativo)
Ajuste nas funções de exclusão nas telas de administração para garantir que, caso o banco de dados não esteja configurado com cascade total, a remoção das relações seja feita explicitamente.

*   **Arquivos:**
    *   `src/routes/admin.cursos.tsx`: Atualizar `handleDelete` para garantir que se o status for mudado para `archived`, a prateleira do aluno reflita essa indisponibilidade (ou excluir se for deletado permanentemente).
    *   `src/routes/admin.ebooks.tsx`: Atualizar `handleDelete` para limpar registros relacionados.

## Detalhes Técnicos
*   Utilização de `ALTER TABLE ... DROP CONSTRAINT` e `ADD CONSTRAINT ... ON DELETE CASCADE` via migração SQL.
*   Garantia de que a lógica de "Arquivamento" (`status = 'archived'`) também filtre o conteúdo na visão do aluno, não apenas a exclusão física.

## Verificação
1. Criar um curso/e-book de teste.
2. Matricular um aluno de teste.
3. Excluir/Arquivar o item no painel administrativo.
4. Verificar se o item desapareceu da rota `/app/cursos` e `/app/ebooks` do aluno.
5. Verificar no banco de dados se os registros em `course_enrollments` e `ebook_enrollments` foram removidos.

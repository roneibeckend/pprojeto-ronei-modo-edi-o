# Plano de Implementação: Conclusão de E-book vinculada ao Curso

Este plano descreve as alterações para garantir que a finalização de um e-book marque o curso correspondente como concluído e desabilite o botão de feedback com o texto "concluído curso finalizado".

## Mudanças no Banco de Dados

### 1. Relacionamento entre E-books e Cursos
*   Adicionar coluna `course_id` (opcional) na tabela `ebooks` para permitir o vínculo entre um e-book e um curso.
*   *Nota:* Se um e-book não estiver vinculado a um curso, o comportamento padrão permanece.

### 2. Automação de Conclusão via RPC/Trigger
*   Implementar uma função `public.complete_linked_course(ebook_id UUID, user_id UUID)` que:
    1.  Verifique se o e-book possui um `course_id`.
    2.  Marque todas as aulas (`lesson_progress`) desse curso como concluídas para o usuário.
    3.  Marque o curso como concluído na tabela `progress_tracking`.

## Mudanças no Backend (Server Functions)

### 1. Atualização do `generateCertificate` em `src/lib/certificates-student.functions.ts`
*   Ao gerar um certificado para um e-book, chamar a nova lógica de conclusão do curso vinculado.

## Mudanças no Frontend

### 1. Rota do E-book (`src/routes/app.ebooks.$ebookId.tsx`)
*   Atualizar o botão de finalização:
    *   Texto quando concluído: "Concluído curso finalizado".
    *   Estado: Desabilitado (`disabled={hasSubmittedFeedback || isActuallyCompleted}`).
    *   Estilo: Reduzir opacidade e remover efeitos de hover/clique.

### 2. Rota do Curso (`src/routes/app.cursos.$courseId.tsx`)
*   Garantir que o botão de feedback já reflita esse estado caso o progresso tenha sido sincronizado via e-book.

## Detalhes Técnicos
*   Utilizar `Zod` para validação de IDs.
*   Garantir idempotência na conclusão do curso.
*   CSS: Aplicar `pointer-events-none` e `opacity-50` no botão desabilitado.

---

Você deseja prosseguir com a adição da coluna `course_id` nos e-books e a implementação do vínculo?
# Plano de Implementação: Atualização do Botão de Finalização

O objetivo é modificar o comportamento do botão de finalização de cursos e e-books para que ele reflita a conclusão após o feedback do aluno.

## Alterações Realizadas

### 1. Componente `FeedbackModal`
- Adição da prop `onSuccess` na interface `FeedbackModalProps`.
- Desestruturação da prop `onSuccess` na definição do componente.
- Invocação de `onSuccess?.()` dentro do `setTimeout` após o envio bem-sucedido do feedback.

### 2. Rota de Cursos (`src/routes/app.cursos.$courseId.tsx`)
- Atualização do texto do botão de finalização para exibir "Concluído curso finalizado" quando `hasSubmittedFeedback` for verdadeiro.
- Passagem da função de callback para a prop `onSuccess` do `FeedbackModal`, que define `hasSubmittedFeedback(true)`.
- Correção na prop `onClose` para não marcar o feedback como enviado apenas ao fechar o modal (agora depende do `onSuccess`).

### 3. Rota de E-books (`src/routes/app.ebooks.$ebookId.tsx`)
- Atualização visual do botão de finalização (layout de e-book) para exibir "Concluído" / "Curso Finalizado" quando `hasSubmittedFeedback` for verdadeiro.
- Passagem da função de callback para a prop `onSuccess` do `FeedbackModal`.
- Ajuste na lógica do `onClose` para consistência com a rota de cursos.

## Verificação Técnica
- A conclusão do curso (marcação das aulas/capítulos) já é gerenciada pelos hooks `useProgress`.
- A persistência do feedback é garantida via Supabase (`course_feedback`), o que já era funcional.
- A mudança visual do botão agora está vinculada ao estado local `hasSubmittedFeedback`, que é sincronizado com o banco de dados durante o carregamento da página.

## Próximos Passos
- Validar o fluxo completo no ambiente de preview (clique -> feedback -> conclusão visual).

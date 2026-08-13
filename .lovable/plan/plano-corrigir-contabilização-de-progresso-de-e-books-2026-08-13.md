# Plano: Corrigir Contabilização de Progresso de E-books

## Objetivo
Garantir que o progresso do usuário em e-books seja contabilizado na barra de progresso global na rota `/app/cursos`, somando-se ao progresso dos cursos.

## Alterações Técnicas

1.  **Ajuste no `useProgress`**:
    *   Analisar a função para garantir que o progresso de e-books esteja sendo corretamente refletido.
    *   Se necessário, criar uma lógica para calcular a porcentagem de conclusão de cada e-book (baseado no número de capítulos lidos/total).

2.  **Atualização no `app.cursos.index.tsx`**:
    *   Modificar a lógica de cálculo do `totalProgress` para somar:
        *   (Total de aulas concluídas + Total de capítulos de e-books lidos) / (Total de aulas dos cursos + Total de capítulos de todos os e-books).
    *   Passar esse novo valor calculado para o componente `ProgressSummary`.

## Verificação
*   Validar se a barra de progresso na página `/app/cursos` reflete a soma real de cursos e e-books.
*   Garantir que a porcentagem de conclusão seja precisa e não cause erros na UI.

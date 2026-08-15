# Plano de Implementação: Solicitação de Feedback após Conclusão de Conteúdo

Este plano descreve as alterações necessárias para garantir que o prompt de feedback seja exibido para o aluno imediatamente após a conclusão de qualquer curso (vídeo-aulas) ou e-book na plataforma.

## Alterações

### 1. Refatoração da Lógica de Detecção de Conclusão de E-book
*   **Arquivo:** `src/routes/app.ebooks.$ebookId.tsx`
*   **Ação:** Mover a lógica de verificação de conclusão para o hook `useProgress` ou aprimorar o `useEffect` existente para garantir que o modal de feedback seja disparado assim que o último capítulo for marcado como concluído.
*   **Melhoria:** Atualmente, a detecção depende de um `useEffect` que pode não disparar instantaneamente após a mutação do banco de dados. Vamos garantir que, após o sucesso da mutação `completeChapter`, a verificação de conclusão total ocorra.

### 2. Implementação de Detecção de Conclusão de Curso (Vídeo-aulas)
*   **Arquivo:** `src/routes/app.cursos.$courseId.tsx`
*   **Ação:** Implementar um mecanismo similar ao dos e-books.
*   **Lógica:** Após marcar a última aula como concluída via `toggleLessonProgress`, o sistema deve verificar se todas as aulas do curso foram finalizadas e, em caso positivo, exibir o `FeedbackModal`.

### 3. Ajustes no `FeedbackModal` para Melhor UX
*   **Arquivo:** `src/components/platform/FeedbackModal.tsx`
*   **Ação:** Garantir que o modal não seja exibido se o usuário já tiver enviado feedback para aquele item específico (verificação via banco de dados ou localStorage persistente).

## Detalhes Técnicos
*   Utilizaremos o hook `useProgress` para obter o estado atualizado das aulas/capítulos concluídos.
*   A verificação de "Concluído" considerará o total de itens (aulas/capítulos) vs itens marcados como concluídos no banco de dados.
*   Será adicionado um estado local para evitar re-aberturas indesejadas do modal durante a mesma sessão.

## Verificação
*   Testar a conclusão de um e-book (marcar todos os capítulos).
*   Testar a conclusão de um curso (marcar todas as aulas).
*   Validar se o modal de feedback aparece imediatamente em ambos os cenários.
*   Validar se o feedback é salvo corretamente no banco de dados.

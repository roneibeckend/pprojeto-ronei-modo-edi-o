# Plano: Sistema de Rastreamento de Progresso

Este plano descreve a implementação do rastreamento de progresso para alunos em cursos e e-books.

## Funcionalidades Propostas

### 1. Rastreamento de Cursos (Aulas)
- Permitir que os alunos marquem as aulas como concluídas manualmente.
- Atualizar visualmente o status da aula na barra lateral (ícone de check).
- Exibir status "Concluída" no botão principal do player.

### 2. Rastreamento de E-books (Capítulos)
- Registrar automaticamente a leitura de um capítulo assim que o aluno o acessa.
- Exibir visualmente os capítulos já lidos no índice do e-book.

### 3. Centralização da Lógica
- Criar um hook `useProgress` para gerenciar todas as operações de progresso (aulas e capítulos).
- Utilizar o Supabase para persistência de dados em tempo real.

## Etapas de Implementação

1. **Criação do Hook**: `src/hooks/use-progress.ts` para encapsular a lógica de banco de dados.
2. **Integração no Player de Curso**: Modificar `src/routes/app.cursos.$courseId.tsx` para incluir o botão de conclusão e feedback visual.
3. **Integração no Leitor de E-book**: Modificar `src/routes/app.ebooks.$ebookId.tsx` para registrar leitura automática ao trocar de capítulo.
4. **Persistência**: Garantir que o progresso seja salvo corretamente nas tabelas `lesson_progress` e `ebook_progress`.

Este sistema permitirá que os alunos acompanhem seu avanço e que a plataforma gere dados de engajamento futuros.

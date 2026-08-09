# Plano: Vídeos de Abertura e Conteúdo em E-books

Este plano descreve a implementação da funcionalidade de vídeos de abertura e vídeos intermediários nos e-books, permitindo uma experiência mais rica para o aluno e controle total para o administrador.

## 1. Alterações no Banco de Dados

- **Tabela `ebooks`**: Adicionar a coluna `opening_video_url` (TEXT, null) para armazenar o vídeo que será exibido antes do conteúdo.
- **Tabela `ebook_chapters`**: A coluna `video_url` já existe e será utilizada para os "vídeos intermediários" (vídeos práticos dentro dos capítulos).
- **Políticas de RLS**: Garantir que as permissões de leitura (SELECT) para alunos e escrita (INSERT/UPDATE/DELETE) para admins estejam corretas para as novas colunas.

## 2. Painel Administrativo (`/admin/ebooks`)

- **Edição de E-book (Informações)**: Adicionar um campo de upload/seleção de vídeo (`VideoUpload`) para o "Vídeo de Abertura".
- **Edição de Capítulos**: Reforçar a interface de edição de capítulos para permitir a inserção e visualização da `video_url`.

## 3. Área do Aluno (`/app/ebooks/$ebookId`)

- **Modal/Player de Abertura**: Ao entrar no e-book, se houver um `opening_video_url`, exibir um player em destaque (ou um modal inicial) com o vídeo de boas-vindas antes de liberar a visualização dos capítulos.
- **Integração no Leitor**: O leitor de capítulos já exibe o vídeo associado ao capítulo. Vou aprimorar o layout para que o vídeo intermediário (se presente) tenha uma posição de destaque no conteúdo.

## 4. Etapas de Implementação

1.  **Migração SQL**: Adicionar `opening_video_url` à tabela `ebooks`.
2.  **Admin UI**: Atualizar o formulário em `src/routes/admin.ebooks.tsx` para incluir o campo de vídeo de abertura.
3.  **Client UI**: Atualizar `src/routes/app.ebooks.$ebookId.tsx` para:
    -   Carregar a nova coluna no loader.
    -   Exibir o vídeo de abertura se o usuário estiver acessando o e-book pela primeira vez na sessão ou se for uma configuração global.
    -   Refinar a exibição do vídeo intermediário no topo/meio do capítulo.

---

O plano foca em expandir as tabelas existentes e atualizar as interfaces de gerenciamento e visualização já estabelecidas.

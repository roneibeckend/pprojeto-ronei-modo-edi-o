# Plano de Refatoração: Interface de Leitura de E-books

Refatorar o leitor de e-books para um modelo baseado em capítulos/módulos com índice lateral, tipografia otimizada e suporte a vídeos, substituindo o modelo de paginação atual.

## 1. Banco de Dados (Supabase)

### Tabelas e Estrutura
- **`ebook_chapters`**:
  - `id`: uuid (primary key)
  - `ebook_id`: uuid (references ebooks.id)
  - `title`: text
  - `content`: text (suporte a Markdown/HTML)
  - `video_url`: text (opcional)
  - `order_index`: int (para ordenação)
  - `reading_minutes`: int (tempo estimado)
  - `created_at`: timestamp

- **`ebook_progress`**:
  - `user_id`: uuid (references auth.users)
  - `chapter_id`: uuid (references ebook_chapters.id)
  - `completed_at`: timestamp
  - `last_read_at`: timestamp

### RLS (Row Level Security)
- **`ebook_chapters`**:
  - `SELECT`: Permitido para usuários autenticados que possuem matrícula no e-book pai (`ebook_enrollments`).
- **`ebook_progress`**:
  - `ALL`: Restrito ao próprio usuário (`auth.uid()`).

### Migração de Dados
- Script para mover o conteúdo atual da coluna `ebooks.content` para um capítulo inicial em `ebook_chapters` para cada e-book existente.

## 2. Interface (Frontend)

### Layout e Componentes
- **Layout de 2 Colunas (Desktop)**:
  - Sidebar fixa à esquerda (Índice).
  - Área de leitura fluida à direita.
- **Header Compacto**:
  - Botão de voltar, título e barra de progresso horizontal global.
- **Navegação (Footer)**:
  - Botões "Anterior" e "Próximo" com os títulos dos capítulos adjacentes.
- **Leitor de Vídeo**:
  - Player 16:9 (iframe) no topo do capítulo se `video_url` estiver presente.
- **Tipografia**:
  - Uso do plugin `@tailwindcss/typography` (`prose prose-invert`) com customizações para o tema dark/orange.

### Interatividade e UX
- **Framer Motion**: Transições suaves de fade/slide entre capítulos.
- **TanStack Query**: Cache de capítulos e sincronização de progresso em tempo real.
- **Keyboard Shortcuts**: Setas esquerda/direita para trocar de capítulo.
- **Mobile**: Índice lateral via `Sheet` (Drawer).
- **Auto-resume**: Abrir automaticamente no último capítulo lido (baseado em `ebook_progress`).

## 3. Etapas de Execução

1. **Migration SQL**: Criar tabelas e políticas de segurança.
2. **Componentes UI**: Criar `EbookReaderSidebar`, `EbookReaderHeader` e `EbookReaderContent`.
3. **Refatoração da Rota**: Atualizar `app.ebooks.$ebookId.tsx` para integrar o novo layout e lógica de dados.
4. **Testes e Ajustes**: Verificar responsividade e acessibilidade.

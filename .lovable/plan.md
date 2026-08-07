# Plano: Integração de Vídeo em E-books

Este plano detalha a implementação da funcionalidade de inserção de vídeos centralizados nos e-books, incluindo a interface de gerenciamento para administradores e a exibição otimizada para os alunos.

## 1. Infraestrutura de Dados
- Validar que a coluna `video_url` em `public.ebook_chapters` está pronta para uso (já presente no schema).
- Garantir que as políticas RLS permitam que administradores, gerentes e agentes editem o conteúdo dos capítulos.

## 2. Interface Administrativa (Gerenciamento)
- **Novo Componente `EbookContentEditor`**:
  - Implementar em `src/routes/admin.ebooks.tsx` para substituir o marcador de "otimização".
  - Visualização em árvore (Módulos > Capítulos).
  - Formulário para cada capítulo incluindo:
    - Título e Índice de Ordem.
    - Conteúdo (Rich Text/HTML).
    - **Campo de URL de Vídeo**: Input para link do vídeo (YouTube/Vimeo/etc).
    - **Player de Preview**: Visualização do vídeo antes de salvar, garantindo que o link é válido.
  - Botões de Salvar/Excluir/Mover.

## 3. Interface do Aluno (Visualização)
- **Refatoração do Reader (`src/routes/app.ebooks.$ebookId.tsx`)**:
  - Ajustar o layout para garantir que, se um capítulo tiver vídeo, ele seja exibido de forma centralizada.
  - O design atual já exibe um vídeo no topo; vou garantir que este seja o comportamento padrão e que o player tenha uma moldura premium condizente com o resto do app.

## 4. Funcionalidade de Vídeo Centralizado
- Implementar uma utilidade ou componente de player que garanta o aspecto centralizado (`mx-auto`) e responsivo.
- Suporte a `allowFullScreen` e controles padrão.

## 5. Validação
- Testar a inserção de um vídeo em um capítulo existente via painel admin.
- Verificar a renderização correta na área de membros.
- Confirmar que o preview no admin funciona em tempo real ao colar a URL.

---
Aprovando este plano, iniciarei a criação do editor de conteúdo completo no painel administrativo.

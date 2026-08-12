# Plano de Ajuste para Vídeos Verticais (9:16)

Este plano visa padronizar todos os vídeos da plataforma (introdução e capítulos) para o formato vertical **9:16**, otimizado para uma experiência estilo "Reels" ou "TikTok".

## Mudanças Técnicas

### 1. Componente Global de Vídeo (`VideoPlayer.tsx`)
- Alterar a classe de proporção de `aspect-video` (16:9) para `aspect-[9/16]`.
- Ajustar o container para garantir que vídeos verticais ocupem o espaço corretamente sem distorção.
- Manter `object-cover` ou `object-contain` conforme a necessidade de preenchimento.

### 2. Leitor de Cursos (`app.cursos.$courseId.tsx`)
- Atualizar o player de vídeo da aula ativa para usar a proporção 9:16.
- Ajustar os vídeos de introdução de módulos na barra lateral para o formato vertical.
- Ajustar o esqueleto de carregamento (`Skeleton`) para refletir o novo formato.

### 3. Leitor de E-books (`app.ebooks.$ebookId.tsx`)
- Alterar o modal de vídeo de abertura (`opening_video_url`) para o formato vertical 9:16.
- Ajustar os vídeos incorporados dentro dos capítulos para a proporção 9:16.
- Redimensionar o container para que o vídeo vertical não ocupe uma altura excessiva em telas grandes (limitar `max-height`).

### 4. Gestão Administrativa (`admin.receitas.tsx` e outros)
- Garantir que as visualizações prévias de vídeo no admin também sigam o padrão vertical.

## Considerações de Layout
- Em desktops, vídeos 9:16 podem ficar muito altos se ocuparem 100% da largura. Implementaremos limites de largura/altura máxima para manter a usabilidade.
- Centralização automática do conteúdo via CSS.

## User Review Required
> [!IMPORTANT]
> A alteração para 9:16 em vídeos que originalmente foram gravados em 16:9 (horizontal) resultará em barras pretas laterais (se usar `object-contain`) ou corte das laterais (se usar `object-cover`). Confirme se os vídeos atuais já estão gravados em formato vertical.

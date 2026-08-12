# Plano de Implementação: Rolagem Automática ao Topo

Este plano descreve a implementação da funcionalidade de rolagem automática para o topo da página sempre que um usuário navegar entre capítulos de um e-book ou lições de um curso.

## Motivação
Melhorar a experiência do usuário (UX) garantindo que, ao mudar de conteúdo, o início do novo texto/vídeo esteja imediatamente visível, evitando que o usuário permaneça no final da "página" anterior.

## Alterações Propostas

### Frontend

1.  **E-book Reader (`src/routes/app.ebooks.$ebookId.tsx`)**
    *   Adicionar um `useEffect` que observa a mudança da variável `activeChapterId`.
    *   Quando `activeChapterId` mudar, executar `window.scrollTo({ top: 0, behavior: 'smooth' })`.

2.  **Course Player (`src/routes/app.cursos.$courseId.tsx`)**
    *   Identificar a variável de estado que controla a lição ativa (provavelmente `activeLessonId`).
    *   Adicionar um `useEffect` similar para rolar ao topo quando a lição mudar.

## Detalhes Técnicos
*   Uso de `window.scrollTo` com `behavior: 'smooth'` para uma transição suave, ou apenas `top: 0` se preferir instantâneo.
*   Garantir que a rolagem ocorra após a atualização do estado do conteúdo.

## Verificação
*   Abrir um e-book, rolar até o fim, clicar em "Próximo Capítulo" e verificar se a página volta para o topo.
*   Repetir o teste em um curso.

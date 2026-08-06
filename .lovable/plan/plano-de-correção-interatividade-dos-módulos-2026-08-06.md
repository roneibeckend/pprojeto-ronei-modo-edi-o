# Plano de Correção: Interatividade dos Módulos

A análise identificou que nos e-books, os módulos são apenas contêineres visuais e a interatividade está restrita aos capítulos internos. Nos cursos, os módulos são apenas rótulos na barra lateral. O objetivo é permitir que o clique no módulo também abra o primeiro conteúdo disponível (capítulo ou aula).

## Mudanças propostas

### 1. E-books (`src/routes/app.ebooks.$ebookId.tsx`)
- Envolver o corpo do módulo em um componente interativo ou adicionar um link no título do módulo.
- **Ação**: Fazer com que o título do módulo (ou o card inteiro) redirecione para o primeiro capítulo daquele módulo caso o usuário clique.

### 2. Cursos (`src/routes/app.cursos.$courseId.tsx`)
- Atualmente, os módulos na barra lateral são apenas `div`.
- **Ação**: Tornar o cabeçalho do módulo clicável para selecionar a primeira aula do respectivo módulo.

## Verificação
1. Navegar até a página de um e-book e clicar no título de um módulo para verificar o redirecionamento para o primeiro capítulo.
2. Navegar até a página de um curso e clicar no nome de um módulo na barra lateral para verificar se a primeira aula é selecionada.

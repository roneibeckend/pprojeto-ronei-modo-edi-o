# Plan: Corrigir Exibição da Listagem de Capítulos do E-book

O usuário relatou que a interface de edição de capítulos no painel administrativo está "bugada". A análise do código em `src/routes/admin.ebooks.tsx` (componente `EbookContentEditor`) revelou que o layout atual utiliza um grid fixo que pode causar sobreposições em telas menores e não possui tratamento de rolagem para listas extensas de capítulos.

## Alterações Propostas

### UI/Layout (`src/routes/admin.ebooks.tsx`)
- **Scroll na Sidebar**: Adicionar `overflow-y-auto` e uma altura máxima (`max-h`) para a listagem de módulos e capítulos, garantindo que o cabeçalho da sidebar e o editor permaneçam acessíveis.
- **Melhoria da Responsividade**: Ajustar o grid de `grid-cols-[350px_1fr]` para `flex-col lg:flex-row` com larguras flexíveis, permitindo que a sidebar ocupe menos espaço em telas menores.
- **Visibilidade de Ações**: Garantir que os botões de ação (Plus, Trash) na sidebar tenham um tamanho de toque adequado e contraste visual, mesmo sem hover (útil para mobile/tablet).
- **Ajuste de Padding e Gap**: Aumentar o espaçamento entre a árvore de capítulos e a área do editor para evitar a sensação de "aperto".
- **Empty State**: Melhorar o estado vazio do editor para ser mais informativo.

### Correções de UX
- Garantir que o botão de "Adicionar Módulo" e "Adicionar Capítulo" não causem deslocamento de layout (layout shift).
- Ajustar a área de conteúdo (textarea) para expandir corretamente conforme o espaço disponível.

## Validação
- Abrir o editor de capítulos para um e-book existente.
- Verificar se a lista de capítulos é rolável independentemente do editor.
- Testar a responsividade mudando o tamanho da janela do navegador.
- Confirmar que as ações de edição e exclusão estão visíveis e funcionais.

# Plano de Otimização do Editor de E-books

Aumentar o tamanho e a eficiência do fluxo de trabalho na interface do editor de capítulos de e-books, transformando o modal e o layout interno para aproveitar melhor o espaço da tela.

## Alterações de UI/Design

### 1. Expansão do Modal
*   Alterar a largura máxima do modal de `max-w-4xl` para `max-w-[95vw]` ou `max-w-7xl`.
*   Ajustar o `min-h` para garantir que ocupe a maior parte da altura disponível.

### 2. Layout do Editor de Conteúdo
*   No componente `EbookContentEditor`, alterar o grid `grid-cols-1 lg:grid-cols-[350px_1fr]` para um modelo que privilegie a área de edição.
*   Transformar o layout de duas colunas (Configurações | Conteúdo) em uma estrutura mais flexível:
    *   Mover as configurações do capítulo (título, ordem, vídeo) para um painel colapsável ou uma barra lateral menor.
    *   **Alternativa recomendada**: Mudar para um layout onde o campo de texto ocupa 100% da largura abaixo de uma seção compacta de configurações.

### 3. Melhorias no Textarea
*   Aumentar o `min-h-[400px]` para `min-h-[600px]` ou torná-lo adaptável ao restante da altura da janela.
*   Garantir que o editor use uma tipografia legível e espaçamento adequado para edição prolongada.

## Detalhes Técnicos
*   Arquivo: `src/routes/admin.ebooks.tsx`
*   Componentes afetados: `AdminEbooksPage` (Modal) e `EbookContentEditor` (Layout interno).
*   Utilização de Tailwind CSS para responsividade (`md:`, `lg:`).

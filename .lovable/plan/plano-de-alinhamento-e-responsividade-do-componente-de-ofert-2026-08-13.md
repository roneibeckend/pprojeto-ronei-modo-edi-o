# Plano de Alinhamento e Responsividade do Componente de Ofertas

O objetivo deste plano é garantir que o componente `PostPurchaseOffer` esteja perfeitamente centralizado e que seu conteúdo de texto seja exibido corretamente em todos os tamanhos de tela, sem cortes ou transbordamentos.

## Alterações Visuais e de Layout

### 1. Centralização Perfeita
- Ajustar as classes do `DialogContent` em `src/components/platform/PostPurchaseOffer.tsx` para garantir centralização absoluta.
- Utilizar `flex flex-col` para gerenciar a altura interna de forma dinâmica.
- Remover o excesso de propriedades de posicionamento manual (`left-[50%]`, `top-[50%]`) se o componente base `Dialog` da UI já as fornecer de forma estável, ou refiná-las para evitar "pulsações" de layout.

### 2. Tratamento Responsivo de Texto
- **Quebra de Linha:** Aplicar `break-words` e `whitespace-normal` em títulos e descrições para evitar que palavras longas quebrem o layout.
- **Títulos de Itens:** Garantir que o título do curso/ebook (atualmente com `truncate`) tenha uma estratégia de fallback ou altura mínima para não esconder informações críticas em telas muito pequenas.
- **Tamanhos de Fonte Dinâmicos:** Reduzir levemente o tamanho da fonte em viewports menores (mobile) para acomodar mais texto.

### 3. Melhoria na Estrutura de Itens (Cards)
- Ajustar o layout do card de oferta para que, em telas muito estreitas, a imagem e o texto se organizem melhor (talvez reduzindo a largura da imagem ou permitindo que o texto ocupe o espaço disponível).

## Detalhes Técnicos
- Arquivo alvo: `src/components/platform/PostPurchaseOffer.tsx`
- Utilização de utilitários Tailwind: `text-balance`, `break-words`, `flex-1`, `min-w-0`.
- Ajuste no container de scroll: `max-h-[50vh]` ou `max-h-[60vh]` para garantir que os botões de ação fiquem sempre visíveis ou fáceis de alcançar.

## Verificação
- Testar em viewports de 320px (iPhone SE) até 1536px (Desktop).
- Validar se o texto longo nos títulos não causa transbordamento horizontal.
- Confirmar se o modal permanece centralizado após a injeção dinâmica de ofertas.

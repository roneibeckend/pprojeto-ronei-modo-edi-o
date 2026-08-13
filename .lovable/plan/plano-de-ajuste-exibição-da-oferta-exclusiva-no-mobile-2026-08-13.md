# Plano de Ajuste: Exibição da Oferta Exclusiva no Mobile

Este plano visa corrigir problemas de layout no popup de "Oferta Exclusiva" que aparece após uma intenção de compra, garantindo que o conteúdo seja totalmente visível e os botões estejam centralizados em dispositivos móveis.

## Problemas Identificados (Mobile)
1.  **Corte de Conteúdo:** Os itens de "upsell" (cursos/ebooks sugeridos) aparecem cortados lateralmente ou em altura.
2.  **Alinhamento de Botões:** Os botões de ação ("Prosseguir sem Ofertas" e "Adicionar Ofertas") não estão devidamente centralizados ou proporcionais no mobile.
3.  **Espaçamento Interno:** O padding excessivo pode estar reduzindo a área útil em telas pequenas.

## Alterações Propostas

### 1. Componente `PostPurchaseOffer.tsx`
*   **Ajuste de Padding:** Reduzir o padding lateral no mobile de `p-6` para `p-4` para maximizar o espaço para o conteúdo.
*   **Layout dos Itens:** 
    *   Ajustar o tamanho das miniaturas (`img`) para que ocupem menos espaço horizontal no mobile.
    *   Garantir que o título e preços usem `flex-1` corretamente sem causar overflow.
*   **Centralização de Botões:**
    *   Forçar `text-center` nos botões ou garantir que o grid `sm:grid-cols-2` se comporte como uma pilha única centralizada no mobile.
    *   Adicionar `justify-center` ao container de botões.
*   **Gerenciamento de Altura:** Refinar as classes de `max-h` e `overflow-y-auto` para evitar que o diálogo fique maior que a viewport do celular.

### 2. Estilização Global/Utilitários
*   Verificar se há conflitos com o componente `Dialog` da UI (shadcn) que possam estar forçando larguras fixas.

## Detalhes Técnicos
*   **Arquivo Alvo:** `src/components/platform/PostPurchaseOffer.tsx`
*   **Classes Tailwind:** Uso de prefixos `sm:` para manter o layout desktop intacto enquanto aplica `px-4`, `w-full` e `items-center` no mobile.

## Verificação
*   Simular visualização em dispositivos móveis (iPhone SE/12/14) no preview do Lovable.
*   Confirmar que o scroll interno funciona suavemente se houver muitas ofertas.
*   Garantir que os botões ocupem a largura total ou estejam centralizados conforme a referência visual.

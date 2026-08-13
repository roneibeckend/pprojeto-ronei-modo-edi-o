# Plano de Correção: Sistema de Ofertas e Checkout

O objetivo deste plano é resolver dois problemas críticos no sistema de e-commerce: a exibição incompleta de produtos na seção de ofertas e a impossibilidade de comprar o curso "Mestre do Churrasco: O Guia Definitivo" por falta de ofertas disponíveis.

## Problemas Identificados

1.  **Exibição de Ofertas:** A interface de ofertas está configurada para selecionar e exibir até 3 produtos aleatórios. Se apenas um produto for exibido quando deveriam ser dois, isso geralmente indica que apenas um produto atende aos critérios de elegibilidade (preço > 0, status 'published', não bloqueado e não adquirido pelo usuário).
2.  **Indisponibilidade do Curso:** O curso "Mestre do Churrasco" está reportando "não há ofertas disponíveis". Isso ocorre porque o componente de ofertas retorna uma tela de erro/vazia quando não encontra produtos complementares para oferecer, o que por sua vez bloqueia o fluxo de checkout iniciado no componente pai.

## Ações Propostas

### 1. Correção da Lógica de Ofertas (`PostPurchaseOffer.tsx`)
*   **Ajuste de Critérios:** Revisar os filtros de busca para garantir que todos os produtos válidos sejam considerados.
*   **Flexibilidade na Quantidade:** Alterar a lógica para exibir todos os produtos encontrados (até o limite de 3) em vez de falhar se não atingir um número específico.
*   **Tratamento de Exceção:** Garantir que, se não houver ofertas complementares, o sistema prossiga automaticamente para o checkout do produto original em vez de exibir uma mensagem de erro que interrompe o fluxo.

### 2. Correção do Fluxo de Checkout (`app.cursos.index.tsx`, `app.ebooks.$ebookId.tsx`, `app.cursos.$courseId.tsx`)
*   **Verificação Prévia:** Adicionar uma verificação rápida antes de abrir o modal de ofertas. Se não houver produtos elegíveis no banco de dados para cross-sell, o checkout deve ser disparado diretamente.
*   **Estabilidade do Curso "Mestre do Churrasco":** Garantir que o produto "Mestre do Churrasco" tenha associações válidas ou que seu fluxo de compra seja resiliente à ausência de ofertas.

### 3. Dados de Teste (Se necessário)
*   Verificar se existem pelo menos dois outros produtos publicados e com preço no banco de dados para servir como ofertas para o curso em questão.

## Detalhes Técnicos

*   **Arquivos afetados:**
    *   `src/components/platform/PostPurchaseOffer.tsx`: Lógica de busca e exibição.
    *   `src/routes/app.cursos.index.tsx`: Disparo do checkout.
    *   `src/routes/app.ebooks.$ebookId.tsx` & `src/routes/app.cursos.$courseId.tsx`: Consistência no fluxo de compra.
*   **Tecnologias:** TanStack Query para cache de dados, Supabase para persistência.

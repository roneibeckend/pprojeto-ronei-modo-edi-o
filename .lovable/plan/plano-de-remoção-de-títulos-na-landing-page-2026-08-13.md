# Plano de Remoção de Títulos na Landing Page

Este plano descreve as alterações necessárias para remover visualmente os títulos especificados na landing page, conforme solicitado pelo usuário.

## Alterações Propostas

### Frontend

#### 1. Remover o título "Edição 2026 · Método completo"
- **Local:** `src/routes/index.tsx` (aproximadamente linha 674).
- **Ação:** Remover o componente `Reveal` que envolve o `span` contendo o texto e o indicador visual de pulsação.

#### 2. Remover o título "Quebrando objeções"
- **Local:** `src/routes/index.tsx` (aproximadamente linha 1921).
- **Ação:** Remover o componente `SectionTag` que exibe este título na seção correspondente.

#### 3. Remover o título "Isso é pra você se…"
- **Local:** `src/routes/index.tsx` (aproximadamente linha 2012).
- **Ação:** Remover o componente `SectionTag` que exibe este título na seção correspondente.

## Detalhes Técnicos
- As remoções serão feitas diretamente no código JSX para garantir que os elementos não sejam renderizados no DOM, evitando qualquer impacto visual residual.
- A estrutura das seções será preservada, removendo apenas as tags de título superiores.

## Validação
- Verificação visual da landing page para confirmar a ausência dos títulos.
- Garantir que o espaçamento entre os elementos restantes permaneça adequado.

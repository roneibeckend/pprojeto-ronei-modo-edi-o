# Plano de Correção: Maximum Update Depth Exceeded

O erro "Maximum update depth exceeded" geralmente é causado por loops infinitos de renderização onde um componente atualiza seu estado, o que dispara uma renderização, que por sua vez dispara outra atualização de estado.

## Diagnóstico

Após analisar o código, identifiquei vários pontos críticos onde o estado é atualizado fora de `useEffect` ou dentro de `useEffect` com dependências que podem mudar a cada renderização, ou ainda em `useState` com inicializadores que executam lógica lateral (side-effects).

### Pontos Críticos Identificados

1.  **Chamadas Diretas no Corpo do Componente/useState**:
    *   `src/routes/app.index.tsx`, `src/routes/app.cursos.index.tsx`, `src/routes/app.ebooks.$ebookId.tsx`, `src/routes/app.cursos.$courseId.tsx`:
        *   Estão chamando `syncWithDatabase()` dentro de um `useState(() => ...)` ou diretamente no corpo. Embora o inicializador do `useState` rode apenas uma vez, disparar uma função assíncrona que atualiza o estado de um store global (Zustand) pode causar inconsistências se o componente remontar ou se houver múltiplas instâncias.
    *   `src/routes/app.cursos.index.tsx`: Possui um `setTimeout` dentro do inicializador `useState` que chama `handlePurchase`, o qual pode disparar modais e atualizações de estado globais.

2.  **useEffect com Dependências Instáveis**:
    *   `src/components/platform/Onboarding.tsx`: O `useEffect` que configura os passos (`setSteps`) depende de `location.pathname` e `isMobile`. Se `setSteps` for chamado e os steps forem usados em algum lugar que afete o layout ou a navegação, pode gerar loops.
    *   `src/components/platform/AsaasPaymentModal.tsx`: O polling de matrículas chama `refetchEnrollments` e `setStatus`. Se `refetchEnrollments` causar uma mudança nas props ou no contexto que o modal consome, o loop pode ocorrer.

3.  **Hooks Customizados (useAuth, useEnrollments, useProgress)**:
    *   Estes hooks dependem uns dos outros e usam `useQuery`. Se as chaves de query não forem estáveis ou se houver invalidações circulares, o React entrará em loop.

## Ações Propostas

### 1. Corrigir Inicialização de Stores Globais
Mover as chamadas de `syncWithDatabase()` de dentro do `useState` para um `useEffect` com array de dependências vazio `[]`. Isso garante que a sincronização ocorra apenas uma vez após a montagem do componente, seguindo o padrão correto do React para efeitos colaterais.

### 2. Estabilizar Dependências em useEffects
*   Em `Onboarding.tsx`, envolver a definição dos `steps` em um `useMemo` ou garantir que `setSteps` só seja chamado se os valores realmente mudarem.
*   Em `AsaasPaymentModal.tsx`, garantir que o polling pare imediatamente ao atingir o estado final.

### 3. Ajustar Lógica de Auto-compra
Em `app.cursos.index.tsx`, mover a lógica de verificação de parâmetros de URL para um `useEffect` único, evitando o uso de `useState` para disparar ações de navegação ou compra.

## Detalhes Técnicos
*   Substituir padrões de `useState(() => { logic(); })` por `useEffect(() => { logic(); }, [])`.
*   Verificar se o componente `VideoPlayer` em `app.ebooks.$ebookId.tsx` e `app.cursos.$courseId.tsx` está causando remontagens infinitas devido a mudanças no `src` ou `videoId`.
*   Assegurar que `handleJoyrideCallback` em `Onboarding.tsx` não esteja disparando atualizações de estado que reiniciem o efeito de steps.

---
Este plano foca em isolar efeitos colaterais e garantir que as atualizações de estado sejam previsíveis e limitadas ao ciclo de vida correto dos componentes.
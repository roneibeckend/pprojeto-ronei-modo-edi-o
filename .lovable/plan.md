# Plano de Resiliência de Layout e Estabilidade Visual

O usuário relatou um problema intermitente onde o site perde o layout e renderiza apenas um HTML básico (fundo branco, sem estilos). Este comportamento geralmente indica falhas no carregamento de ativos (CSS/JS), erros críticos durante a hidratação do React ou problemas com o Service Worker do PWA que serve versões corrompidas ou incompletas do cache.

## Diagnóstico Técnico

1.  **Hydration Mismatch**: O TanStack Start v1 pode falhar na hidratação se houver diferenças entre o HTML gerado no servidor e o renderizado no cliente, resultando em "piscadas" ou quebras totais de layout.
2.  **Asset Loading Failures**: Se o arquivo `styles.css` falhar ao carregar devido a problemas de rede ou cache do PWA, o navegador renderiza o HTML sem estilos (fundo branco).
3.  **Service Worker Stale/Corrupted**: O PWA pode estar servindo uma versão antiga do `index.html` que tenta carregar arquivos JS/CSS que não existem mais (hashes antigos), causando o erro "Failed to fetch dynamically imported module".
4.  **Erro Crítico no Root**: O `ErrorComponent` no `src/routes/__root.tsx` já possui uma lógica de recarregamento, mas pode ser insuficiente se o erro ocorrer antes da montagem do componente.

## Mudanças Propostas

### 1. Robustez do Carregamento de Estilos e Metadados
-   Otimizar o `head` no `src/routes/__root.tsx` para garantir que o CSS crítico seja priorizado.
-   Adicionar um tratador de erro global no `index.html` (ou via script injetado no root) para detectar falhas de carregamento de recursos e forçar um recarregamento limpo.

### 2. Tratamento de Erros de Hidratação e Chunk
-   Aprimorar o `ErrorComponent` para detectar especificamente erros de "chunk loading" e limpar o cache do Service Worker antes de recarregar.
-   Implementar uma estratégia de "Auto-Recovery" que detecta se a página está sem estilos (via verificação de variáveis CSS) e tenta corrigir o estado.

### 3. Melhoria na Página de Erro de "Baixo Nível"
-   Personalizar a `renderErrorPage` em `src/lib/error-page.ts` para seguir a identidade visual do projeto (Dark/Fire) em vez do padrão genérico, evitando a sensação de "site quebrado".

### 4. Sincronização de PWA
-   Ajustar a lógica do `PwaUpdateManager.tsx` para ser mais agressiva na detecção de atualizações críticas que podem causar incompatibilidade de layout.

## Detalhes Técnicos

### Arquivos afetados:
-   `src/routes/__root.tsx`: Adição de script de auto-recovery e melhoria no `ErrorComponent`.
-   `src/lib/error-page.ts`: Estilização premium da página de fallback catastrófico.
-   `src/components/platform/PwaUpdateManager.tsx`: Refinamento da detecção de novos workers.

### Script de Auto-Recovery (Exemplo):
```javascript
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message?.includes('chunk') || e.message?.includes('dynamically imported')) {
      console.warn('Detectado erro de carregamento. Forçando refresh...');
      window.location.reload();
    }
  }, true);
}
```

O plano visa garantir que, mesmo em condições de rede instáveis ou caches corrompidos, o sistema recupere automaticamente o layout premium em vez de exibir uma tela branca.

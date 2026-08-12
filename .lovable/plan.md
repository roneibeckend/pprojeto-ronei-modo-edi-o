# Plano de Correção: Recuperação de Erro e Redirecionamento Inteligente

Este plano aborda a correção do loop de erro e o comportamento inadequado dos botões de recuperação na tela de erro global da aplicação.

## Problemas Identificados
1.  **Loop de Erro:** O botão "Tentar novamente" apenas invalida a rota e reseta o componente, o que pode não ser suficiente se o erro persistir no cache do TanStack Query ou no estado global.
2.  **Redirecionamento Incorreto:** O botão "Ir para o início" usa um link `<a>` simples para `/`, o que sempre leva à landing page, ignorando o estado de autenticação do usuário.
3.  **Falta de Informação:** A mensagem de erro é genérica e não ajuda na depuração.

## Alterações Propostas

### 1. Refatoração do `ErrorComponent` em `src/routes/__root.tsx`
-   **Redirecionamento Inteligente:** Substituir o link estático por uma função que verifica o estado de autenticação via Supabase. Se o usuário estiver logado, redirecionar para `/app` (ou `/inicio`). Caso contrário, ir para `/`.
-   **Melhoria no "Tentar Novamente":** Adicionar `queryClient.resetQueries()` para garantir que falhas de carregamento de dados sejam efetivamente limpas antes da nova tentativa.
-   **Logs e Mensagens:** Exibir o código ou mensagem técnica do erro em modo de desenvolvimento ou através de um colapsável para usuários avançados/suporte.

### 2. Melhoria na Robustez do `AppGate` em `src/routes/app.tsx`
-   Adicionar um `ErrorBoundary` local ou garantir que falhas no `getSession` não causem telas brancas infinitas antes de cair no erro global.

## Detalhes Técnicos
-   Utilização do `QueryClient` injetado no contexto da rota para resetar o estado.
-   Uso de `supabase.auth.getSession()` de forma síncrona/rápida para decidir o destino do botão "Início".

## Verificação e Testes
1.  **Simular Erro:** Forçar um erro em uma loader (ex: desconectar internet ou alterar URL da API temporariamente).
2.  **Testar 'Tentar Novamente':** Verificar se a aplicação tenta recarregar os dados do zero.
3.  **Testar 'Ir para o Início':**
    -   Logado: Clicar no botão e verificar se vai para `/app`.
    -   Deslogado: Clicar no botão e verificar se vai para `/`.

# Plano de Otimização de Performance e Navegação

Melhorar a experiência do usuário desktop, otimizando o fluxo pós-login, performance de navegação e controle de exibição de ofertas.

## Mudanças

### Fluxo Pós-Login
- **src/routes/login.tsx**: Remover o redirecionamento baseado em `redirectTo` imediato após o login para garantir que o destino padrão seja sempre `/inicio` (a tela inicial principal), a menos que haja uma ação explícita.
- **src/routes/app.ebooks.$ebookId.tsx** & **src/routes/app.cursos.$courseId.tsx**: Desativar a funcionalidade de "retomar de onde parou" automática. O estado será salvo, mas a navegação para o último capítulo/aula só ocorrerá se o usuário clicar em um botão "Continuar" na tela inicial ou no card do curso, e não via redirecionamento automático de login.

### Performance e Navegação
- **src/routes/app.index.tsx**: Otimizar queries do Supabase para o dashboard, removendo carregamentos redundantes.
- **src/components/platform/Shell.tsx**: Implementar pré-carregamento (prefetch) de rotas críticas ao passar o mouse sobre os itens do menu da sidebar.
- **src/router.tsx**: Ajustar as configurações do TanStack Router para otimizar o cache de rotas e reduzir "piscadas" (HMR e transições).

### Controle de Ofertas
- **src/routes/app.index.tsx**: Alterar o gatilho da `PostPurchaseOffer`. Ela não será mais exibida automaticamente no `useEffect` de carregamento.
- **src/components/platform/PostPurchaseOffer.tsx**: Garantir que o modal exija uma interação ou uma flag específica de "intenção de compra" para ser exibido.
- **src/hooks/use-post-purchase-offer.ts**: Adicionar estados para controle refinado de exibição, evitando aparições prematuras.

## Detalhes Técnicos
- Utilização de `router.preloadRoute` para navegação instantânea.
- Migração de lógicas de "auto-resume" de `localStorage` para componentes de UI (botões) em vez de `useEffect` automáticos no mount.
- Refatoração da lógica de `checkFirstAccess` para ser passiva.

## Verificação
- Testar fluxo de login e garantir destino em `/inicio`.
- Validar se a navegação entre cursos e ebooks é instantânea (via prefetch).
- Confirmar que o popup de oferta não aparece sozinho ao entrar no dashboard.

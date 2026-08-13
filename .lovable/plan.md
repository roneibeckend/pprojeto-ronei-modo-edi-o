# Plano - Corrigir bloqueio de scroll do mouse

Corrigir a falha que impede a rolagem das páginas de "Login" e "Landing Page" através da roda do mouse (scroll), mantendo a funcionalidade da barra de rolagem lateral.

## Análise da Causa Raiz
A suspeita principal recai sobre a regra `overscroll-behavior-y: none;` aplicada ao elemento `body` no arquivo `src/styles.css`. Esta propriedade, quando aplicada em conjunto com configurações específicas de altura (`100dvh` ou `-webkit-fill-available`), pode interceptar e descartar eventos de scroll em navegadores específicos ou contextos de containers, impedindo a rolagem natural da página.

## Proposta de Alterações

### Estilização Global
- Modificar `src/styles.css` para remover ou ajustar `overscroll-behavior-y: none;` no `body`. 
- Revisar as propriedades `height` e `overflow` no `html` e `body` para garantir que o documento permita o scroll nativo sem bloqueios.

### Verificação de Componentes Específicos
- Inspecionar `src/routes/index.tsx` (Landing Page) e `src/routes/login.tsx` (Login) em busca de bibliotecas ou hooks (ex: `framer-motion`, `react-scroll-lock`) que possam estar travando o scroll.
- Verificar se existem overlays invisíveis ou modais abertos por padrão que capturem eventos de mouse.

## Detalhes Técnicos
- **CSS**: Alterar `overscroll-behavior-y: none` para `auto` ou remover a linha.
- **Layout**: Garantir que o `html` e o `body` não tenham `overflow: hidden` aplicado de forma permanente que afete estas rotas.

## Plano de Validação
- **Teste Manual**: Navegar até `/` (Landing Page) e `/login` e tentar rolar a página usando a roda do mouse.
- **Cross-browser**: Verificar se o comportamento é restaurado no Chrome/Edge.
- **Scrollbar**: Confirmar que a barra de rolagem lateral continua operando normalmente.

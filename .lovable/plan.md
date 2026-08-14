# Plano de Auditoria e Otimização Mobile Estrutural

Realizaremos uma auditoria profunda da experiência mobile, focando em performance, fluidez e correção da causa raiz de problemas de visibilidade e navegação lenta.

## 1. Inventário de Rotas e Verificação de Responsividade
Mapearemos todas as rotas para garantir que cada uma seja testada em resoluções de 320px a 768px (Mobile/Tablet).

- **Landing Page**: `/`
- **Área do Cliente (`/app`)**:
  - Home: `/app`
  - Conteúdo: `/app/cursos/*`, `/app/ebooks/*`, `/app/receitas`, `/app/ao-vivo`
  - Perfil e Financeiro: `/app/perfil`, `/app/financeiro`, `/app/afiliados/*`
  - Suporte e Certificados: `/app/suporte`, `/app/certificados`
- **Área Administrativa (`/admin`)**:
  - Dashboard: `/admin`
  - Gestão: `/admin/alunos/*`, `/admin/cursos`, `/admin/ebooks`, `/admin/financeiro`, `/admin/integracoes`, `/admin/materiais`

## 2. Correção de Visibilidade (Animações de Scroll)
Otimizaremos o componente `Reveal` em `src/routes/index.tsx` e o CSS global para garantir que o conteúdo nunca fique invisível no mobile.

- **Ajuste de IntersectionObserver**: Aumentar `rootMargin` e reduzir `threshold` no mobile para disparar animações mais cedo.
- **Fallback de Visibilidade**: Garantir `opacity: 1` imediato se o observer falhar ou demorar.
- **Simplificação Mobile**: Desabilitar animações pesadas (tilt, blur excessivo) em dispositivos móveis via media queries.

## 3. Otimização de Navegação e Performance
Investigaremos a lentidão na troca de rotas e carregamento.

- **TanStack Router Optimization**: Verificar se loaders estão bloqueando a UI excessivamente.
- **Shell & Layout**: Otimizar o componente `Shell.tsx` para evitar re-renders desnecessários.
- **Assets & Memória**: Revisar o carregamento de vídeos (Google Drive/Supabase) para garantir que não haja vazamento de memória ou travamento do scroll.
- **CSS global**: Revisar `src/styles.css` para remover filtros pesados (`backdrop-filter`) em áreas críticas de scroll mobile.

## 4. Estabilidade da UI
- **Prevenir Layout Shift (CLS)**: Definir `min-height` em containers de vídeo e imagens.
- **Feedback Tátil**: Garantir que botões e links tenham estados ativos claros e respondam instantaneamente ao toque (300ms delay check).

## Detalhes Técnicos
- Utilização de `will-change: transform, opacity` de forma moderada.
- Respeito a `prefers-reduced-motion`.
- Priorização de `display: block` ou `opacity: 1` via CSS em vez de JS para o primeiro viewport.

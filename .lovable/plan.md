# Plano de Auditoria e Otimização Desktop

Realizar uma auditoria técnica e visual profunda focada na experiência Desktop (Notebooks a Monitores Ultrawide), garantindo aproveitamento de tela, performance e consistência visual sem comprometer as otimizações mobile já realizadas.

## 1. Mapeamento e Inventário (Etapa 1)
- Criar matriz de rotas: Landing Page, `/app/*`, `/admin/*`.
- Identificar gargalos de largura (`max-width`) e espaços vazios exagerados.

## 2. Ajustes de Resolução e Containers (Etapas 2 e 3)
- Implementar containers adaptativos:
  - Landing Page: Largura controlada para legibilidade.
  - Admin/App Dashboards: `max-width: 1600px` ou superior para aproveitar telas grandes.
  - Tabelas: Otimizar para ocupar até 98% da largura disponível quando necessário.
- Revisar `padding-inline` em resoluções 1024px a 1440px.

## 3. Sidebar e Header (Etapas 4 e 5)
- **Sidebar**:
  - Garantir scroll independente.
  - Otimizar transição do estado colapsado (evitar layout shifts pesados).
  - Centralizar ícones e ajustar tooltips no modo mini.
- **Header**:
  - Reduzir altura vertical em notebooks (1366x768).
  - Melhorar alinhamento de breadcrumbs e ações de perfil.

## 4. Dashboards e Grids (Etapas 6 e 7)
- **Hierarquia Visual**: Indicadores (KPIs) -> Ações -> Relatórios.
- **Grids Dinâmicos**:
  - 1024px: 2 colunas.
  - 1366px: 3 colunas.
  - 1920px+: 4 ou 5 colunas (onde fizer sentido).
- Padronizar altura de cards e evitar esticamento excessivo em monitores ultra-wide.

## 5. Tabelas e Filtros (Etapas 8 e 9)
- **Tabelas**:
  - Colunas com larguras inteligentes (IDs curtos, Nomes flexíveis).
  - Implementar Sticky Header para listagens longas.
  - Otimizar menu de ações (Dropdown em vez de botões espalhados).
- **Filtros**:
  - Alinhamento horizontal eficiente (Busca + Filtros em uma linha).
  - Mover filtros secundários para um popover "Mais Filtros".

## 6. Modais (Etapa 10)
- Ajustar `max-width` para modais de formulário (não devem ocupar a tela toda).
- Garantir que modais longos tenham scroll interno e botões de ação fixos na base.

## Detalhes Técnicos
- Utilizar classes utilitárias do Tailwind (ex: `2xl:max-w-7xl`, `3xl:max-w-[1600px]`).
- Verificar `overflow-x-hidden` em containers globais para evitar scroll lateral fantasma.
- Testar performance de renderização em grids complexos.

# Plano de Implementação: Filtro de Período no Dashboard Financeiro

O objetivo deste plano é expandir o dashboard financeiro administrativo existente para incluir a funcionalidade de filtragem por período, permitindo a visualização de dados financeiros em intervalos de tempo específicos (Hoje, Últimos 7 dias, Mês Atual, Personalizado, etc.).

## 1. Alterações no Backend

Modificar a função de servidor `getFinancialSummary` para suportar parâmetros de data.

- **Arquivo**: `src/lib/finance.functions.ts`
- **Ações**:
    - Atualizar `getFinancialSummary` para aceitar `startDate` e `endDate` (ISO Strings) via `.inputValidator()`.
    - Ajustar a query do Supabase para filtrar a tabela `payments` pela coluna `created_at`.

## 2. Componentes de UI

Criar um novo componente de seleção de período integrado ao design atual.

- **Componente**: `PeriodSelector` (dentro de `admin.financeiro.tsx` ou em arquivo separado).
- **Funcionalidades**:
    - Select com opções predefinidas: "Hoje", "Últimos 7 dias", "Mês Atual", "Mês Anterior", "Ano Atual", "Ano Anterior", "Intervalo Personalizado".
    - Inputs de data (Início/Fim) exibidos apenas quando "Intervalo Personalizado" for selecionado.
    - Persistência da seleção no `localStorage`.

## 3. Integração no Dashboard

- **Arquivo**: `src/routes/admin.financeiro.tsx`
- **Ações**:
    - Adicionar estado para o período selecionado (`period`, `customStartDate`, `customEndDate`).
    - Atualizar a `useQuery` de dados financeiros para incluir o período como dependência.
    - Passar as datas formatadas para a função `fetchFinancialSummary`.
    - Garantir que todos os cálculos (lucro, margem, divisões de sócios) sejam recalculados com base nos novos dados.

## Detalhes Técnicos

- **Bibliotecas**: `date-fns` para manipulação de datas e `lucide-react` para ícones.
- **Padrão**: TanStack Start `createServerFn` e `useQuery`.
- **Estilo**: Tailwind CSS v4 seguindo a paleta de cores do projeto (Fire/Orange/Black).

## Verificação

1.  Acessar `/admin/financeiro`.
2.  Selecionar diferentes períodos predefinidos e verificar se a receita bruta é atualizada.
3.  Testar o intervalo personalizado com datas específicas.
4.  Recarregar a página e confirmar se o filtro selecionado foi mantido (se persistente).

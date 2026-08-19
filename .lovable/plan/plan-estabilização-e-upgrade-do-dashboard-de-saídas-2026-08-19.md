# Plan: Estabilização e Upgrade do Dashboard de Saídas

O usuário relata insatisfação com a página `/admin/financeiro/saques`, indicando que as funcionalidades solicitadas anteriormente não estão presentes ou funcionando como esperado. O objetivo é transformar esta página em um Cockpit de Gestão de Saídas completo, integrando automação Asaas, registros manuais e conciliação bancária.

## User Review Required

> [!IMPORTANT]
> A página será reestruturada para focar em **Fluxo de Caixa de Saída**. Você terá abas para gerenciar:
> 1. **Saques Asaas**: Sincronização automática de transferências feitas pelo gateway.
> 2. **Solicitações de Afiliados/Sócios**: Onde você aprova e paga (via Pix Asaas automático) as comissões.
> 3. **Lançamentos Manuais**: Para despesas extras ou retiradas em espécie.

## Proposed Changes

### Database & Backend
- Reforçar RLS na tabela `asaas_transfers` para garantir que apenas admins gerenciem dados.
- Garantir que `payout_requests` com status 'paid' e `asaas_payment_id` preenchido apareçam no dashboard de saídas para conciliação.
- Otimizar `syncTransfersWithDb` em `src/lib/asaas-transfers.server.ts` para capturar metadados estendidos do Asaas (taxas, tipo de chave Pix).

### Frontend Layout Updates
- **Novo Design Premium**: Substituir a tabela simples por um layout de cards informativos e uma tabela de auditoria avançada.
- **Abas de Contexto**:
    - `Visão Geral`: Gráficos de saída por categoria (Manual vs Asaas vs Payout).
    - `Conciliação Asaas`: Lista de transferências vindas da API.
    - `Pagamentos Pendentes`: Atalho para aprovação de saques de afiliados/sócios (integrando `payout_requests`).
- **Filtros Avançados**: Por período, tipo de transação (Pix, Transferência, Manual) e status.
- **Ações Rápidas**: Botão de "Pagar via Pix Asaas" integrado para solicitações pendentes.

### Implementation Steps
1. **Auditoria de Rotas**: Verificar se a navegação em `src/routes/admin.tsx` está apontando corretamente sem conflitos de cache.
2. **Refatoração da Página**: Reescrever `src/routes/admin.financeiro.saques.tsx` para incorporar a nova UI de "Cockpit Financeiro".
3. **Integração de Payouts**: Adicionar a visualização de `payout_requests` no dashboard de saídas, centralizando tudo que "sai" da conta.
4. **Validação**: Testar o fluxo de registro manual e sincronização via Playwright.

## Technical Details
- Uso de `useQuery` com `refetchInterval` para dados em tempo real se necessário.
- Componentes Shadcn (Tabs, Card, Badge) com estilização customizada Ronnei na Veia (Fire/Gold).
- Hooks customizados para cálculo de totais mensais dinâmicos.

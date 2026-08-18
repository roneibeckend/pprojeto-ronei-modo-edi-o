---
title: Reestruturação da Gestão de Saques (Asaas)
description: Transformar o menu "Gestão de Saques" em um controle centralizado de saídas da conta Asaas, com histórico automático e manual.
---

## 1. Banco de Dados

### Nova Tabela: `public.asaas_transfers`
Armazenará o histórico de todas as transferências realizadas da conta Asaas (saques para a conta bancária do proprietário).

```sql
CREATE TABLE public.asaas_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asaas_id text UNIQUE, -- ID retornado pelo Asaas
    amount numeric NOT NULL,
    status text NOT NULL, -- PENDING, BANK_PAID, FAILED, etc.
    transfer_date timestamp with time zone NOT NULL DEFAULT now(),
    description text,
    transaction_type text DEFAULT 'transfer', -- 'transfer' (automático) ou 'manual'
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_transfers TO authenticated;
GRANT ALL ON public.asaas_transfers TO service_role;

-- RLS
ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transfers"
ON public.asaas_transfers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

## 2. Backend (Server Functions)

### `src/lib/asaas-transfers.functions.ts`
- `listAsaasTransfers`: Busca transferências da conta Asaas via API e sincroniza com o banco local.
- `syncAsaasTransfers`: Função para forçar a sincronização dos últimos saques.
- `createManualTransfer`: Permite registrar um saque que não foi capturado automaticamente ou ocorreu por outro meio.

### `src/lib/asaas-transfers.server.ts`
- Implementação da lógica de comunicação com `/transfers` do Asaas usando `getAsaasConfig`.

## 3. Frontend (UI)

### `src/routes/admin.financeiro.saques.tsx`
Refatorar completamente a página atual (que hoje foca em sócios) para:
- **Dashboard de Saídas**: Total sacado no mês, saques pendentes.
- **Lista de Movimentações**: Tabela com Data, Valor, Descrição e Status (ícones coloridos).
- **Botão Sincronizar**: Chamada manual para buscar novos dados do Asaas.
- **Botão Novo Registro**: Modal para inserção manual de saques.

## 4. Navegação

### `src/routes/admin.tsx`
- Manter o item de menu "Gestão de Saques", mas garantir que ele aponte para a página refatorada.
- O controle de saques de sócios será movido para uma sub-aba dentro de "Financeiro" ou ficará acessível via link na própria página de gestão de saques.

## Detalhes Técnicos
- Utilizar a API do Asaas `GET /v3/transfers` para listar os saques.
- O campo `status` do Asaas (`PENDING`, `BANK_PAID`, `CANCELLED`) será mapeado para a UI.
- Sincronização automática via webhook (opcional, para fase 2) ou via polling no carregamento da página.

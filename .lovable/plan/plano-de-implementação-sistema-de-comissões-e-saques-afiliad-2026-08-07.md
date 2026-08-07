# Plano de Implementação: Sistema de Comissões e Saques (Afiliados e Sócios)

Este plano detalha a criação de um sistema robusto para gestão de comissões, solicitações de saque e integração com o Asaas para pagamentos.

## 1. Alterações no Banco de Dados

- **Tabela `public.payout_requests`**:
  - `id` (uuid, PK)
  - `user_id` (uuid, references profiles.id)
  - `amount` (numeric, not null)
  - `status` (enum: 'pending', 'analyzing', 'approved', 'paid', 'rejected')
  - `method` (text, e.g., 'pix', 'asaas_transfer')
  - `pix_key` (text, opcional)
  - `asaas_payment_id` (text, opcional - ID da transferência no Asaas)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Extensão da tabela `public.affiliates`** (se necessário) ou uso de `profiles` para saldo acumulado.
- **Novas Políticas RLS**:
  - Usuários podem ver suas próprias solicitações.
  - Apenas administradores podem atualizar o status e ver todas.
  - GRANTs para `authenticated` e `service_role`.

## 2. Lógica de Servidor (TanStack Server Functions)

- **`src/lib/payouts.functions.ts`**:
  - `requestPayout`: Valida o saldo disponível e cria o registro em `payout_requests`.
  - `getPayoutHistory`: Retorna o histórico do usuário logado.
  - `adminUpdatePayoutStatus`: (Admin) Atualiza o status e, se 'approved', pode disparar a criação da transferência no Asaas.
- **Integração Asaas**:
  - Implementar chamada à API do Asaas para Transferências (`/transfers`).

## 3. Interface do Usuário (Afiliados/Sócios)

- **`src/routes/app.afiliados.financeiro.tsx`**:
  - Atualizar para mostrar saldo disponível, saldo pendente e histórico de saques.
  - Botão "Solicitar Saque" que abre um modal para valor e chave PIX.
- **Nova Rota `src/routes/app.socios.financeiro.tsx`**:
  - Interface similar, mas focada nos lucros acumulados mensais dos sócios.

## 4. Interface Administrativa

- **`src/routes/admin.financeiro.saques.tsx`**:
  - Painel para administradores gerenciarem todas as solicitações pendentes.
  - Ações para Aprovar (integrar com Asaas), Pagar Manualmente ou Rejeitar.

## 5. Automação para Sócios

- **Cron Job**:
  - Configurar um gatilho mensal para notificar sócios ou consolidar lucros passíveis de saque.

---
**Observação**: O Asaas exige que a conta tenha saldo e, para transferências via API, a conta deve estar verificada. Usaremos o `ASAAS_API_KEY` configurado nos segredos do projeto.

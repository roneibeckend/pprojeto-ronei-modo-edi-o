// src/lib/asaas-transfers.server.ts
import { getAsaasConfig, asaasHeaders } from "./asaas.server";

export interface AsaasTransfer {
  id: string;
  value: number;
  status: string;
  transferDate: string;
  description: string | null;
  transactionReceiptUrl: string | null;
  bankAccount: {
    bank: {
      name: string;
    };
    account: string;
    accountDigit: string;
  };
}

export async function fetchAsaasTransfers() {
  const { apiKey, baseUrl } = await getAsaasConfig();
  
  // O Asaas usa GET /transfers para listar transferências
  const res = await fetch(`${baseUrl}/transfers?limit=50`, {
    headers: asaasHeaders(apiKey),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`Asaas API error (${res.status}): ${errorBody}`);
  }

  const json = await res.json();
  return (json?.data || []) as AsaasTransfer[];
}

export async function syncTransfersWithDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const transfers = await fetchAsaasTransfers();
  
  const formatted = transfers.map(t => ({
    asaas_id: t.id,
    amount: t.value,
    status: t.status,
    transfer_date: t.transferDate,
    description: t.description || `Transferência Asaas para ${t.bankAccount?.bank?.name || 'conta bancária'}`,
    transaction_type: 'transfer',
    metadata: {
      receipt_url: t.transactionReceiptUrl,
      bank_info: t.bankAccount
    }
  }));

  if (formatted.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('asaas_transfers')
    .upsert(formatted, { onConflict: 'asaas_id' })
    .select();

  if (error) {
    console.error("[Asaas Transfers] Sync error:", error);
    throw error;
  }

  return data;
}

/** Valida o token do webhook do Asaas (mesmo token usado para pagamentos). */
export async function validateAsaasWebhookToken(token: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('credentials')
    .eq('category', 'asaas')
    .maybeSingle();

  const expected = ((integration?.credentials || {}) as Record<string, any>)?.webhookToken;
  if (!expected) return false;
  return token === expected;
}

/** Registra/atualiza automaticamente uma saída da conta Asaas recebida por webhook. */
export async function upsertTransferFromWebhook(transfer: any, event: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const row = {
    asaas_id: transfer.id as string,
    amount: Number(transfer.value ?? transfer.netValue ?? 0),
    status: (transfer.status as string) || 'PENDING',
    transfer_date: transfer.transferDate
      ? new Date(transfer.transferDate).toISOString()
      : new Date(transfer.dateCreated || Date.now()).toISOString(),
    description:
      transfer.description ||
      `Transferência Asaas para ${transfer.bankAccount?.bank?.name || transfer.pixAddressKey || 'conta bancária'}`,
    transaction_type: 'transfer',
    metadata: {
      event,
      receipt_url: transfer.transactionReceiptUrl ?? null,
      bank_info: transfer.bankAccount ?? null,
      operation_type: transfer.operationType ?? null,
      net_value: transfer.netValue ?? null,
      fee: transfer.transferFee ?? null,
    },
  };

  const { error } = await supabaseAdmin
    .from('asaas_transfers')
    .upsert(row, { onConflict: 'asaas_id' });

  if (error) {
    console.error('[Asaas Transfers] Webhook upsert error:', error);
    throw error;
  }

  return row;
}

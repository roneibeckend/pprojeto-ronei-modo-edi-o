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

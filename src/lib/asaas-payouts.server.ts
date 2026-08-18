import { getAsaasConfig, asaasHeaders } from "./asaas.server";

export async function processPixPayout(params: {
  amount: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  description?: string;
}) {
  const { apiKey, baseUrl } = await getAsaasConfig();

  // 1. Asaas requer que o pagador tenha saldo em conta.
  // Em sandbox, o saldo é simulado. Em produção, precisa de saldo real.
  
  // 2. Realizar a transferência (Pix Payout)
  const response = await fetch(`${baseUrl}/transfers`, {
    method: 'POST',
    headers: asaasHeaders(apiKey),
    body: JSON.stringify({
      value: params.amount,
      pixAddressKey: params.pixKey,
      pixAddressKeyType: params.pixKeyType,
      description: params.description || 'Distribuição de Lucros - Ronnei na Veia',
      scheduleDate: null, // Imediato
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[Asaas Payout] Erro:", result);
    throw new Error(result.errors?.[0]?.description || "Erro ao processar pagamento Pix no Asaas");
  }

  return result;
}

/** 
 * Detecta o tipo de chave Pix baseado no formato
 * Nota: Simples detecção, em um caso real pode ser mais robusto.
 */
export function detectPixKeyType(key: string): 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM' {
  const cleanKey = key.replace(/\D/g, '');
  
  if (cleanKey.length === 11) return 'CPF';
  if (cleanKey.length === 14) return 'CNPJ';
  if (key.includes('@')) return 'EMAIL';
  if (cleanKey.length >= 10 && cleanKey.length <= 13) return 'PHONE';
  
  return 'RANDOM';
}

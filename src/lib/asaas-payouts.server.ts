import { getAsaasConfig, asaasHeaders } from "./asaas.server";

export async function processPixPayout(params: {
  amount: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  description?: string;
}) {
  const { apiKey, baseUrl } = await getAsaasConfig();

  // Asaas Pix Payout (Transferência)
  const response = await fetch(`${baseUrl}/transfers`, {
    method: 'POST',
    headers: asaasHeaders(apiKey),
    body: JSON.stringify({
      value: params.amount,
      pixAddressKey: params.pixKey,
      pixAddressKeyType: params.pixKeyType,
      description: params.description || 'Distribuição de Lucros - Ronnei na Veia',
      scheduleDate: null, // Pagamento imediato
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("[Asaas Payout] Erro:", result);
    const errorMsg = result.errors?.[0]?.description || "Erro ao processar pagamento Pix no Asaas";
    throw new Error(errorMsg);
  }

  return result;
}

/** 
 * Detecta o tipo de chave Pix baseado no formato.
 */
export function detectPixKeyType(key: string): 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM' {
  const cleanKey = key.replace(/\D/g, '');
  
  if (cleanKey.length === 11) return 'CPF';
  if (cleanKey.length === 14) return 'CNPJ';
  if (key.includes('@')) return 'EMAIL';
  // Celular com DDD (10 ou 11 dígitos) ou com DDI +55 (12 ou 13 dígitos)
  if (cleanKey.length >= 10 && cleanKey.length <= 13) return 'PHONE';
  
  return 'RANDOM';
}

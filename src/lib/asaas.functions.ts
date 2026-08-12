import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_PRODUCTION_URL = "https://www.asaas.com/api/v3";

export const createAsaasPaymentLink = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    productId: z.string(),
    productType: z.enum(['course', 'ebook']),
    title: z.string(),
    description: z.string().optional(),
    value: z.number(),
    affiliateRef: z.string().optional(),
    paymentType: z.enum(['unique', 'recurring']).optional(),
    dueDays: z.number().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    // 1. Buscar credenciais do Asaas
    const { data: integration, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('category', 'asaas')
      .eq('status', true)
      .single();

    if (intError || !integration) {
      throw new Error("Integração com Asaas não está configurada ou ativa.");
    }

    const credentials = integration.credentials as Record<string, string>;
    const settings = (integration.settings || {}) as Record<string, any>;
    const apiKey = credentials.apiKey;
    
    if (!apiKey) {
      throw new Error("Chave de API do Asaas ausente nas configurações.");
    }

    // O banco de dados usa testMode (boolean) em vez de environment (string)
    // Forçar ambiente baseado no prefixo da chave se possível para evitar erros de configuração
    const isProdKey = apiKey.startsWith('$aact_prod_');
    const isSandboxKey = apiKey.startsWith('$aact_test_');
    
    let isTestMode = settings.testMode === true || settings.testMode === 'true' || settings.environment === 'sandbox';
    
    // Auto-correção: Se a chave for de produção mas estiver em testMode, avisar ou corrigir
    if (isProdKey && isTestMode) {
      console.warn("[Asaas] Chave de PRODUÇÃO detectada em ambiente de TESTE. Forçando PRODUÇÃO.");
      isTestMode = false;
    } else if (isSandboxKey && !isTestMode) {
      console.warn("[Asaas] Chave de SANDBOX detectada em ambiente de PRODUÇÃO. Forçando SANDBOX.");
      isTestMode = true;
    }

    const baseUrl = isTestMode ? ASAAS_SANDBOX_URL : ASAAS_PRODUCTION_URL;
    
    console.log(`[Asaas] Usando ambiente: ${isTestMode ? 'SANDBOX' : 'PRODUCTION'} | URL: ${baseUrl}`);

    // 2. Criar Link de Pagamento no Asaas
    // Referência: https://docs.asaas.com/reference/criar-um-link-de-pagamento
    try {
      const response = await fetch(`${baseUrl}/paymentLinks`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'access_token': apiKey,
          'User-Agent': 'Lovable-LMS-Platform/1.0.0 (+https://lovable.app)'
        },
        body: JSON.stringify({
          name: data.title,
          description: data.description || `Acesso ao ${data.productType === 'course' ? 'Curso' : 'E-book'}: ${data.title}`,
          value: data.value,
          billingType: 'UNDEFINED', // Permite que o cliente escolha (Boleto, Cartão, Pix)
          chargeType: data.paymentType === 'recurring' ? 'RECURRENT' : 'DETACHED',
          dueDateLimitDays: data.dueDays || 3,
          endDate: null,
          notificationEnabled: true,
          externalReference: `${data.productType}:${data.productId}${data.affiliateRef ? `:ref_${data.affiliateRef}` : ''}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.description || "Erro ao criar link no Asaas");
      }

      const result = await response.json();

      return {
        url: result.url,
        id: result.id
      };
    } catch (error: any) {
      console.error("[Asaas] Erro ao criar link:", error);
      const errorMessage = error.message || "Falha na comunicação com o Asaas";
      throw new Error(`${errorMessage}. Verifique se a Chave de API está correta e se o ambiente (Produção/Sandbox) corresponde à chave.`);
    }
  });

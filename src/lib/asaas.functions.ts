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
    const settings = integration.settings as Record<string, string>;
    const apiKey = credentials.apiKey;
    const environment = settings.environment || 'sandbox';
    const baseUrl = environment === 'production' ? ASAAS_PRODUCTION_URL : ASAAS_SANDBOX_URL;

    if (!apiKey) {
      throw new Error("Chave de API do Asaas ausente nas configurações.");
    }

    // 2. Criar Link de Pagamento no Asaas
    // Referência: https://docs.asaas.com/reference/criar-um-link-de-pagamento
    try {
      const response = await fetch(`${baseUrl}/paymentLinks`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name: data.title,
          description: data.description || `Acesso ao ${data.productType === 'course' ? 'Curso' : 'E-book'}: ${data.title}`,
          value: data.value,
          billingType: 'UNDEFINED', // Permite que o cliente escolha (Boleto, Cartão, Pix)
          chargeType: 'DETACHED',
          endDate: null,
          maxInstallmentCount: 1,
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
      throw new Error(error.message || "Falha na comunicação com o Asaas");
    }
  });

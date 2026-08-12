import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  asaasHeaders,
  buildExternalReference,
  findConfirmedPayment,
  getAsaasConfig,
  grantAccess,
} from "./asaas.server";

export const createAsaasPaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }) => {
    const { apiKey, baseUrl, isTestMode } = await getAsaasConfig();

    console.log(`[Asaas] Ambiente: ${isTestMode ? 'SANDBOX' : 'PRODUCTION'} | URL: ${baseUrl}`);

    try {
      const response = await fetch(`${baseUrl}/paymentLinks`, {
        method: 'POST',
        headers: asaasHeaders(apiKey),
        body: JSON.stringify({
          name: data.title,
          description: data.description || `Acesso ao ${data.productType === 'course' ? 'Curso' : 'E-book'}: ${data.title}`,
          value: data.value,
          billingType: 'UNDEFINED',
          chargeType: data.paymentType === 'recurring' ? 'RECURRENT' : 'DETACHED',
          dueDateLimitDays: data.dueDays || 3,
          endDate: null,
          notificationEnabled: true,
          externalReference: buildExternalReference({
            productType: data.productType,
            productId: data.productId,
            userId: context.userId,
            affiliateRef: data.affiliateRef || null,
          }),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.description || "Erro ao criar link no Asaas");
      }

      const result = await response.json();

      return { url: result.url, id: result.id };
    } catch (error: any) {
      console.error("[Asaas] Erro ao criar link:", error);
      const errorMessage = error.message || "Falha na comunicação com o Asaas";
      throw new Error(`${errorMessage}. Verifique se a Chave de API está correta e se o ambiente (Produção/Sandbox) corresponde à chave.`);
    }
  });

/** Verificação manual: consulta o Asaas e libera o acesso se o pagamento já foi confirmado. */
export const verifyAsaasPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    productId: z.string(),
    productType: z.enum(['course', 'ebook']),
  }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const payment = await findConfirmedPayment({
        productType: data.productType,
        productId: data.productId,
        userId: context.userId,
      });

      if (!payment) {
        return { confirmed: false, message: "Nenhum pagamento confirmado encontrado ainda." };
      }

      const granted = await grantAccess(data.productType, data.productId, context.userId);
      return {
        confirmed: granted,
        message: granted
          ? "Pagamento confirmado e acesso liberado."
          : "Pagamento encontrado, mas houve falha ao liberar o acesso.",
      };
    } catch (error: any) {
      console.error("[Asaas] Erro na verificação manual:", error);
      return { confirmed: false, message: error.message || "Falha ao verificar o pagamento." };
    }
  });

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
    products: z.array(z.object({
      productId: z.string(),
      productType: z.enum(['course', 'ebook']),
      title: z.string(),
      description: z.string().optional().nullable(),
      value: z.number().optional(),
    })),
    affiliateRef: z.string().optional(),
    paymentType: z.enum(['unique', 'recurring']).optional(),
    dueDays: z.number().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { apiKey, baseUrl, isTestMode } = await getAsaasConfig();

    console.log(`[Asaas] Ambiente: ${isTestMode ? 'SANDBOX' : 'PRODUCTION'} | URL: ${baseUrl}`);

    try {
      // SECURITY: preços autoritativos vêm do banco, nunca do cliente.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const pricedProducts: { productId: string; productType: 'course' | 'ebook'; title: string; value: number }[] = [];
      for (const p of data.products) {
        const table = p.productType === 'course' ? 'courses' : 'ebooks';
        const { data: row, error: priceError } = await supabaseAdmin
          .from(table)
          .select('price, title')
          .eq('id', p.productId)
          .maybeSingle();
        if (priceError || !row) throw new Error("Produto não encontrado.");
        const price = Number((row as any).price ?? 0);
        if (!(price > 0)) throw new Error("Produto sem preço válido para checkout.");
        pricedProducts.push({
          productId: p.productId,
          productType: p.productType,
          title: (row as any).title || p.title,
          value: price,
        });
      }

      const totalValue = pricedProducts.reduce((acc, p) => acc + p.value, 0);
      const mainProduct = pricedProducts[0];
      const rawTitles = pricedProducts.map(p => p.title).join(' + ');

      // Sanitização rigorosa para o Asaas: apenas alfanuméricos, espaços, hífen e underscore.
      // Remove acentos e caracteres especiais que causam o erro "O nome do link de pagamento não pode conter caracteres especiais."
      const sanitizeAsaasName = (text: str) => {
        return text
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/[^\w\s-]/g, "") // Remove tudo que não é alfanumérico, espaço, hífen ou underscore
          .replace(/\s+/g, " ") // Colapsa múltiplos espaços
          .trim();
      };

      const sanitizedName = sanitizeAsaasName(rawTitles);
      const finalName = sanitizedName.length > 100 
        ? sanitizedName.substring(0, 97) + '...' 
        : sanitizedName;

      const response = await fetch(`${baseUrl}/paymentLinks`, {
        method: 'POST',
        headers: asaasHeaders(apiKey),
        body: JSON.stringify({
          name: finalName || `Pedido ${mainProduct.productId}`,
          description: `Acesso a: ${rawTitles.substring(0, 450)}`, // Descrição pode ser mais permissiva, mas limitamos tamanho
          value: totalValue,
          billingType: 'UNDEFINED',
          chargeType: data.paymentType === 'recurring' ? 'RECURRENT' : 'DETACHED',
          dueDateLimitDays: data.dueDays || 3,
          endDate: null,
          notificationEnabled: true,
          externalReference: buildExternalReference({
            productType: mainProduct.productType,
            productId: mainProduct.productId,
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
        userEmail: (context.claims as any)?.email ?? null,
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

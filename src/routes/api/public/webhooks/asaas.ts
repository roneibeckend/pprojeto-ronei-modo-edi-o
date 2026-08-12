import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getAsaasConfig,
  grantAccess,
  parseExternalReference,
  resolveUserFromPayment,
} from "@/lib/asaas.server";

export const Route = createFileRoute('/api/public/webhooks/asaas')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const token = request.headers.get('asaas-access-token');

          console.log('[Webhook Asaas] Recebido:', {
            event: body.event,
            id: body.payment?.id,
            status: body.payment?.status,
            externalReference: body.payment?.externalReference,
          });

          // Buscar integração para validar token
          const { data: integration, error: intError } = await supabaseAdmin
            .from('integrations')
            .select('credentials')
            .eq('category', 'asaas')
            .single();

          if (intError) {
            console.error('[Webhook Asaas] Erro ao buscar credenciais:', intError);
          }

          const credentials = (integration?.credentials || {}) as Record<string, any>;
          const expectedToken = credentials?.webhookToken || credentials?.apiKey;

          if (!expectedToken || token !== expectedToken) {
            console.error('[Webhook Asaas] Token de acesso inválido ou ausente.');
            return new Response('Unauthorized', { status: 401 });
          }

          const confirmEvents = [
            'PAYMENT_RECEIVED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
          ];

          if (confirmEvents.includes(body.event)) {
            const parsed = parseExternalReference(body.payment?.externalReference);

            if (!parsed?.productType || !parsed?.productId) {
              console.warn('[Webhook Asaas] Referência externa ausente/inválida — nada a liberar.');
            } else {
              const { productType, productId, affiliateCode } = parsed;
              const customerEmail = body.payment?.customerEmail;
              const amount = body.value || body.payment?.value;

              // 1) id do usuário embutido na referência externa
              let userId: string | null = parsed.userId;

              // 2) Fallback: resolver pelo e-mail (payload ou API de clientes do Asaas)
              if (!userId) {
                try {
                  const { apiKey, baseUrl } = await getAsaasConfig();
                  userId = await resolveUserFromPayment(body.payment, baseUrl, apiKey);
                } catch (e) {
                  console.error('[Webhook Asaas] Falha ao resolver usuário:', e);
                }
              }

              if (!userId) {
                console.warn(`[Webhook Asaas] Usuário não identificado (email: ${customerEmail ?? 'n/d'}).`);
              } else {
                const granted = await grantAccess(productType, productId, userId);
                console.log(
                  `[Webhook Asaas] Acesso ${granted ? 'liberado' : 'NÃO liberado'}: ${productType}/${productId} -> ${userId}`,
                );
                
                // --- REGISTRO DE PAGAMENTO AUTOMATIZADO ---
                try {
                  const { apiKey, baseUrl } = await getAsaasConfig();
                  const res = await fetch(`${baseUrl}/payments/${body.payment?.id}`, {
                    headers: asaasHeaders(apiKey)
                  });
                  
                  if (res.ok) {
                    const fullPayment = await res.json();
                    
                    // Cálculo de taxas Asaas: 
                    // Se o Asaas não retornar netValue, calculamos estimativa
                    // Geralmente Asaas retorna: value (bruto), netValue (líquido)
                    const amount = fullPayment.value || body.payment?.value || 0;
                    const netAmount = fullPayment.netValue || (amount * 0.97 - 0.50); // Fallback 3% + 0.50 se não disponível
                    const fee = amount - netAmount;

                    await supabaseAdmin.from('payments').upsert({
                      external_id: body.payment?.id,
                      user_id: userId,
                      amount: amount,
                      net_amount: netAmount,
                      fee: fee,
                      status: body.payment?.status || 'CONFIRMED',
                      billing_type: fullPayment.billingType,
                      external_reference: body.payment?.externalReference,
                      customer_id: fullPayment.customer,
                      confirmed_at: fullPayment.confirmedDate || new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'external_id' });
                    
                    console.log(`[Webhook Asaas] Pagamento registrado: R$ ${netAmount.toFixed(2)} (Líquido)`);
                  }
                } catch (e) {
                  console.error('[Webhook Asaas] Erro ao registrar pagamento:', e);
                }
                // ------------------------------------------

                // Comissão de afiliado
                if (affiliateCode) {
                  const { data: linkData } = await supabaseAdmin
                    .from('affiliate_links')
                    .select('affiliate_id')
                    .eq('code', affiliateCode)
                    .maybeSingle();

                  if (linkData) {
                    const affiliateId = linkData.affiliate_id;

                    const { data: affiliate } = await supabaseAdmin
                      .from('affiliates')
                      .select('commission_rate')
                      .eq('id', affiliateId)
                      .eq('status', 'active')
                      .maybeSingle();

                    if (affiliate) {
                      const commissionRate = affiliate.commission_rate || 30;
                      const commissionAmount = ((amount || 0) * commissionRate) / 100;

                      const saleData: any = {
                        affiliate_id: affiliateId,
                        amount: amount,
                        commission: commissionAmount,
                        status: 'pending',
                        metadata: {
                          payment_id: body.payment?.id,
                          customer_email: customerEmail,
                        },
                      };

                      if (productType === 'course') {
                        saleData.course_id = productId;
                      }

                      await supabaseAdmin.from('affiliate_sales').insert(saleData);

                      await supabaseAdmin.rpc('increment_affiliate_earnings', {
                        aff_id: affiliateId,
                        amount_to_add: commissionAmount,
                      });
                      console.log(`[Webhook Asaas] Comissão processada: R$ ${commissionAmount.toFixed(2)}`);
                    }
                  }
                }
              }
            }
          }

          return new Response(JSON.stringify({ received: true, event: body.event }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('[Webhook Asaas] Erro crítico no processamento:', error);
          return new Response(JSON.stringify({ error: 'Internal logic failure' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});

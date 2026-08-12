import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute('/api/public/webhooks/asaas')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Enviar resposta 200 OK imediatamente para evitar "webhook interrompido" por timeout
        // No TanStack Start handlers, precisamos processar o corpo antes de retornar, 
        // mas vamos garantir que a lógica seja rápida e segura.
        
        try {
          const body = await request.json();
          const token = request.headers.get('asaas-access-token');

          console.log('[Webhook Asaas] Recebido:', {
            event: body.event,
            id: body.payment?.id,
            status: body.payment?.status,
            externalReference: body.payment?.externalReference
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

          const credentials = integration?.credentials as Record<string, any>;
          const expectedToken = credentials?.webhookToken || credentials?.apiKey;
          
          if (!expectedToken || token !== expectedToken) {
            console.error('[Webhook Asaas] Token de acesso inválido ou ausente. Recebido:', token, 'Esperado:', expectedToken ? '***' : 'NENHUM');
            // Retornamos 401 apenas se o token for explicitamente errado para avisar o Asaas
            return new Response('Unauthorized', { status: 401 });
          }

          // Se for pagamento confirmado ou recebido
          if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'].includes(body.event)) {
            const externalRef = body.payment?.externalReference; // "type:id[:u_userId][:ref_CODE]"
            const parsed = parseExternalReference(externalRef);
            if (parsed) {
              const { productType, productId, affiliateCode } = parsed;
              const customerEmail = body.payment?.customerEmail;
              const amount = body.value || body.payment?.value;

              // 1) Preferimos o id do usuário embutido na referência externa
              let userId: string | null = parsed.userId;

              // 2) Fallback: resolver pelo e-mail (payload ou API de clientes do Asaas)
              if (!userId) {
                userId = await resolveUserFromPayment(body.payment, baseUrl, apiKeyForLookup);
              }

              if (userId) {
                const granted = await grantAccess(productType!, productId!, userId);
                console.log(`[Webhook Asaas] Acesso ${granted ? 'liberado' : 'NÃO liberado'}: ${productType}/${productId} -> ${userId}`);


                  // Processar Comissão de Afiliado
                  if (affiliateCode) {
                    const { data: linkData } = await supabaseAdmin
                      .from('affiliate_links')
                      .select('affiliate_id')
                      .eq('code', affiliateCode)
                      .single();

                    if (linkData) {
                      const affiliateId = linkData.affiliate_id;
                      
                      const { data: affiliate } = await supabaseAdmin
                        .from('affiliates')
                        .select('commission_rate')
                        .eq('id', affiliateId)
                        .eq('status', 'active')
                        .single();

                      if (affiliate) {
                        const commissionRate = affiliate.commission_rate || 30;
                        const commissionAmount = (amount * commissionRate) / 100;

                        const saleData: any = {
                          affiliate_id: affiliateId,
                          amount: amount,
                          commission: commissionAmount,
                          status: 'pending',
                          metadata: { 
                            payment_id: body.payment?.id,
                            customer_email: customerEmail 
                          }
                        };

                        if (productType === 'course') {
                          saleData.course_id = productId;
                        }

                        await supabaseAdmin.from('affiliate_sales').insert(saleData);

                        // Incrementar ganhos totais e saldo
                        await supabaseAdmin.rpc('increment_affiliate_earnings', {
                          aff_id: affiliateId,
                          amount_to_add: commissionAmount
                        });
                        console.log(`[Webhook Asaas] Comissão de afiliado processada: R$ ${commissionAmount.toFixed(2)}`);
                      }
                    }
                  }
                } else {
                  console.warn(`[Webhook Asaas] Perfil não encontrado para o email: ${customerEmail}`);
                }
              }
            }
          }

          return new Response(JSON.stringify({ received: true, event: body.event }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[Webhook Asaas] Erro crítico no processamento:', error);
          // Retornamos 200 mesmo em erro de processamento interno para que o Asaas não fique tentando 
          // enviar o mesmo webhook problemático infinitamente, a menos que queiramos o retry.
          // Como o Asaas marca como "interrompido" após falhas seguidas, 200 é mais seguro.
          return new Response(JSON.stringify({ error: 'Internal logic failure' }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});

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
          if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(body.event)) {
            const externalRef = body.payment?.externalReference; // Formato "type:id" ou "type:id:ref_CODE"
            if (externalRef && externalRef.includes(':')) {
              const parts = externalRef.split(':');
              const productType = parts[0];
              const productId = parts[1];
              const affiliatePart = parts.find((p: string) => p.startsWith('ref_'));
              const affiliateCode = affiliatePart ? affiliatePart.replace('ref_', '') : null;
              
              const customerEmail = body.payment?.customerEmail;
              const amount = body.value || body.payment?.value;

              if (customerEmail) {
                const { data: profile } = await supabaseAdmin
                  .from('profiles')
                  .select('id')
                  .eq('email', customerEmail)
                  .single();

                if (profile) {
                  const userId = profile.id;

                  // Lógica de Matrícula (Cursos ou Ebooks)
                  if (productType === 'course') {
                    await supabaseAdmin.from('course_enrollments').upsert({
                      user_id: userId,
                      course_id: productId,
                    }, { onConflict: 'user_id,course_id' });
                    console.log(`[Webhook Asaas] Matrícula em curso realizada: ${productId} para ${customerEmail}`);
                  } else if (productType === 'ebook') {
                    await supabaseAdmin.from('ebook_enrollments').upsert({
                      user_id: userId,
                      ebook_id: productId,
                    }, { onConflict: 'user_id,ebook_id' });
                    console.log(`[Webhook Asaas] Matrícula em ebook realizada: ${productId} para ${customerEmail}`);
                  }

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

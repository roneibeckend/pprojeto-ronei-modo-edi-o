import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
            externalReference: body.payment?.externalReference
          });

          // Buscar integração para validar token
          const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('credentials')
            .eq('category', 'asaas')
            .single();

          const credentials = integration?.credentials as Record<string, any>;
          const expectedToken = credentials?.webhookToken || credentials?.apiKey;
          
          if (!expectedToken || token !== expectedToken) {
            console.error('[Webhook Asaas] Token de acesso inválido ou ausente');
            return new Response('Unauthorized', { status: 401 });
          }

          // Se for pagamento confirmado ou recebido
          if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(body.event)) {
            const externalRef = body.payment?.externalReference; // Formato "type:id" ou "type:id:ref_CODE"
            if (externalRef && externalRef.includes(':')) {
              const parts = externalRef.split(':');
              const productType = parts[0];
              const productId = parts[1];
              const affiliatePart = parts.find(p => p.startsWith('ref_'));
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

                  if (productType === 'course') {
                    await supabaseAdmin.from('course_enrollments').upsert({
                      user_id: userId,
                      course_id: productId,
                    }, { onConflict: 'user_id,course_id' });
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

                        await supabaseAdmin.from('affiliate_sales').insert({
                          affiliate_id: affiliateId,
                          course_id: productType === 'course' ? productId : null,
                          amount: amount,
                          commission: commissionAmount,
                          status: 'pending',
                          metadata: { 
                            payment_id: body.payment?.id,
                            customer_email: customerEmail 
                          }
                        });

                        // Incrementar ganhos totais e saldo
                        await supabaseAdmin.rpc('increment_affiliate_earnings', {
                          aff_id: affiliateId,
                          amount_to_add: commissionAmount
                        });
                      }
                    }
                  }
                  
                  console.log(`[Webhook Asaas] Acesso liberado para ${customerEmail}: ${productType} ${productId}`);
                }
              }
            }
          }

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[Webhook Asaas] Erro:', error);
          return new Response('Error processing webhook', { status: 500 });
        }
      }
    }
  }
});

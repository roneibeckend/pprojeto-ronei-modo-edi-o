import { createFileRoute } from '@tanstack/react-router';
import { triggerEmailEvent } from '@/lib/resend.server';
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  asaasHeaders,
  getAsaasConfig,
  grantAccess,
  parseExternalReference,
  resolveUserFromPayment,
  fetchPaymentFromAsaas,
} from "@/lib/asaas.server";

export const Route = createFileRoute('/api/public/webhooks/asaas')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let eventId: string | null = null;
        let claimToken: string | null = null;

        try {
          if (request.method !== 'POST') {
             return new Response('Method Not Allowed', { status: 405 });
          }

          // Use a fresh body for validation
          const body = await request.json();
          const token = request.headers.get('asaas-access-token');

          // 1. Schema Validation
          if (!body.id || !body.event || !body.payment?.id) {
            console.error('[Webhook Asaas] Invalid schema: missing id, event or payment.id');
            return new Response('Bad Request', { status: 400 });
          }

          eventId = body.id;
          const paymentId = body.payment.id;
          const eventType = body.event;

          // 2. Webhook Token Validation
          const { data: integration, error: intError } = await supabaseAdmin
            .from('integrations')
            .select('credentials')
            .eq('category', 'asaas')
            .single();

          if (intError || !integration) {
            console.error('[Webhook Asaas] Fail closed: Integração não encontrada ou erro:', intError);
            return new Response('Configuration Error', { status: 500 });
          }

          const credentials = (integration.credentials || {}) as Record<string, any>;
          const expectedToken = credentials?.webhookToken;

          if (!expectedToken) {
            console.error('[Webhook Asaas] Fail closed: webhookToken não configurado.');
            return new Response('Forbidden', { status: 403 });
          }

          if (token !== expectedToken) {
            console.error('[Webhook Asaas] Token de acesso inválido.');
            return new Response('Unauthorized', { status: 401 });
          }

          // 3. Event Filter
          const confirmEvents = [
            'PAYMENT_RECEIVED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
          ];

          if (!confirmEvents.includes(eventType)) {
             return new Response(JSON.stringify({ received: true, event: eventType }), {
               status: 200,
               headers: { 'Content-Type': 'application/json' },
             });
          }

          // 4. Server-to-Server Confirmation (BEFORE Claim to avoid trash records)
          console.log(`[Webhook Asaas] Verificando pagamento ${paymentId} via API...`);
          const verifiedPayment = await fetchPaymentFromAsaas(paymentId);

          // 5. Validate Verified Payment Status
          const validStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
          if (!validStatuses.includes(verifiedPayment.status)) {
            console.warn(`[Webhook Asaas] Pagamento ${paymentId} com status inválido para liberação: ${verifiedPayment.status}`);
            return new Response(JSON.stringify({ received: true, message: 'Payment not confirmed' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 6. Match User and Product
          const parsed = parseExternalReference(verifiedPayment.externalReference);
          if (!parsed?.productType || !parsed?.productId) {
            console.error('[Webhook Asaas] Referência externa inválida no pagamento verificado.');
            return new Response('Invalid Reference', { status: 400 });
          }

          const { productType, productId, affiliateCode } = parsed;
          let userId: string | null = parsed.userId;

          if (!userId) {
            const { apiKey, baseUrl } = await getAsaasConfig();
            userId = await resolveUserFromPayment(verifiedPayment, baseUrl, apiKey);
          }

          if (!userId) {
            console.error(`[Webhook Asaas] Usuário não identificado para o pagamento ${paymentId}`);
            return new Response('User Not Found', { status: 404 });
          }

          // 7. Atomic Idempotency Claim (Postgres RPC)
          const { data: claim, error: claimError } = await supabaseAdmin.rpc('acquire_asaas_webhook_claim', {
            p_event_id: eventId,
            p_payment_id: paymentId,
            p_event_type: eventType,
            p_payload: body
          }) as { data: any, error: any };

          if (claimError || !claim || !claim[0]?.claim_token) {
            // Check if already completed by reading directly
            const { data: check } = await supabaseAdmin
                .from('asaas_webhook_events')
                .select('status')
                .eq('event_id', eventId)
                .maybeSingle();

            if (check?.status === 'completed') {
                return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            console.warn(`[Webhook Asaas] Evento ${eventId} não pôde ser adquirido (concorrência ou erro):`, claimError);
            return new Response(JSON.stringify({ received: true, message: 'Claim denied' }), {
              status: 202, 
              headers: { 'Content-Type': 'application/json' },
            });
          }

          claimToken = claim[0].claim_token as string;

          // 8. Grant Access
          const granted = await grantAccess(productType, productId, userId);
          if (!granted) {
            throw new Error('Falha ao liberar acesso no banco de dados.');
          }

          console.log(`[Webhook Asaas] Acesso liberado: ${productType}/${productId} -> ${userId}`);

          // 9. Process Secondary Effects
          try {
            const amount = verifiedPayment.value || 0;
            const netAmount = verifiedPayment.netValue || (amount * 0.97 - 0.50);
            const fee = amount - netAmount;

            await supabaseAdmin.from('payments').upsert({
              external_id: paymentId,
              user_id: userId,
              amount: amount,
              net_amount: netAmount,
              fee: fee,
              status: verifiedPayment.status,
              billing_type: verifiedPayment.billingType,
              external_reference: verifiedPayment.externalReference,
              customer_id: verifiedPayment.customer,
              confirmed_at: verifiedPayment.confirmedDate || new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'external_id' });

            const customerEmail = verifiedPayment.customerEmail;
            if (customerEmail && userId) {
              const { data: profile } = await supabaseAdmin.from('profiles').select('name').eq('id', userId).maybeSingle();
              const userName = profile?.name || 'Cliente';
              const templateName = productType === 'course' ? 'course_access' : 'ebook_access';
              
              const { data: product } = await supabaseAdmin
                .from(productType === 'course' ? 'courses' : 'ebooks')
                .select('title')
                .eq('id', productId)
                .maybeSingle();

              await triggerEmailEvent({
                event: templateName,
                to: customerEmail,
                data: {
                  name: userName,
                  product_name: product?.title || (productType === 'course' ? 'Treinamento' : 'E-book'),
                  access_link: 'https://lovable.app/app'
                },
                idempotencyKey: `access_${paymentId}`
              });
            }
          } catch (secondaryError) {
            console.error('[Webhook Asaas] Erro em efeitos secundários (matrícula OK):', secondaryError);
          }

          // 10. Mark as Completed (OWNER CHECK)
          const { error: completeError } = await supabaseAdmin
            .from('asaas_webhook_events')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('event_id', eventId)
            .eq('claim_token', claimToken)
            .eq('status', 'processing');

          if (completeError) {
            console.error('[Webhook Asaas] Falha ao completar evento (dono inválido ou expirado):', completeError);
          }

          return new Response(JSON.stringify({ received: true, processed: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('[Webhook Asaas] Erro crítico:', error);
          
          if (eventId && claimToken) {
            await supabaseAdmin
              .from('asaas_webhook_events')
              .update({
                status: 'failed',
                last_error: error.message
              })
              .eq('event_id', eventId)
              .eq('claim_token', claimToken)
              .eq('status', 'processing');
          }

          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});

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
        try {
          if (request.method !== 'POST') {
             return new Response('Method Not Allowed', { status: 405 });
          }

          const body = await request.json();
          const token = request.headers.get('asaas-access-token');

          // 1. Webhook Token Validation
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
          const expectedToken = credentials?.webhookToken; // Usando explicitamente webhookToken conforme solicitado

          if (!expectedToken) {
            console.error('[Webhook Asaas] Fail closed: webhookToken não configurado.');
            return new Response('Forbidden', { status: 403 });
          }

          if (token !== expectedToken) {
            console.error('[Webhook Asaas] Token de acesso inválido.');
            return new Response('Unauthorized', { status: 401 });
          }

          // 2. Event Validation
          const confirmEvents = [
            'PAYMENT_RECEIVED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
          ];

          if (!confirmEvents.includes(body.event)) {
             return new Response(JSON.stringify({ received: true, event: body.event }), {
               status: 200,
               headers: { 'Content-Type': 'application/json' },
             });
          }

          // 3. Extract Payment ID
          const paymentId = body.payment?.id;
          if (!paymentId) {
            console.error('[Webhook Asaas] Payment ID ausente no payload.');
            return new Response('Bad Request', { status: 400 });
          }

          // 4. Atomic Idempotency Claim
          // We use a lease-like approach to prevent concurrent processing.
          // If the event exists and is 'completed', we stop.
          // If it's 'processing', we check if the lease is old (stuck).
          // If it doesn't exist, we insert 'processing'.
          
          const { data: existingEvent, error: claimFetchError } = await supabaseAdmin
            .from('asaas_webhook_events')
            .select('event_id, status, claimed_at')
            .eq('event_id', body.id)
            .maybeSingle();

          if (existingEvent) {
            if (existingEvent.status === 'completed') {
              console.log(`[Webhook Asaas] Evento ${body.id} já concluído. Ignorando.`);
              return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            
            // If it's 'processing', check for timeout (e.g., 5 minutes) to allow retry of stuck processes
            const claimedAt = new Date(existingEvent.claimed_at).getTime();
            const now = Date.now();
            const leaseTimeout = 5 * 60 * 1000; // 5 minutes
            
            if (now - claimedAt < leaseTimeout) {
              console.warn(`[Webhook Asaas] Evento ${body.id} está sendo processado por outra instância.`);
              return new Response(JSON.stringify({ received: true, message: 'Processing in progress' }), {
                status: 202, // Accepted for processing (in progress)
                headers: { 'Content-Type': 'application/json' },
              });
            }
            
            // If timed out or failed, we re-claim by updating status to 'processing' and resetting claimed_at
            const { error: reClaimError } = await supabaseAdmin
              .from('asaas_webhook_events')
              .update({ status: 'processing', claimed_at: new Date().toISOString(), last_error: null })
              .eq('event_id', body.id)
              .eq('status', existingEvent.status); // Optimistic lock

            if (reClaimError) {
               console.error('[Webhook Asaas] Falha ao re-adquirir evento:', reClaimError);
               return new Response('Conflict', { status: 409 });
            }
          } else {
            // New event: Atomic INSERT to claim
            const { error: insertError } = await supabaseAdmin
              .from('asaas_webhook_events')
              .insert({
                event_id: body.id,
                payment_id: paymentId,
                event_type: body.event,
                status: 'processing',
                payload: body
              });

            if (insertError) {
              // If insert fails due to PK, it means another request just won the race
              console.warn(`[Webhook Asaas] Evento ${body.id} conquistado por outra requisição concorrente.`);
              return new Response(JSON.stringify({ received: true, message: 'Claim lost' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
          }

          // From this point, only ONE instance (the winner of the claim) continues.


          // 5. Server-to-Server Confirmation
          console.log(`[Webhook Asaas] Verificando pagamento ${paymentId} via API...`);
          const verifiedPayment = await fetchPaymentFromAsaas(paymentId);

          // 6. Validate Verified Payment Status
          const validStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
          if (!validStatuses.includes(verifiedPayment.status)) {
            console.warn(`[Webhook Asaas] Pagamento ${paymentId} com status inválido para liberação: ${verifiedPayment.status}`);
            return new Response(JSON.stringify({ received: true, message: 'Payment not confirmed' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 7. Match User and Product
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

          // 8. Grant Access
          const granted = await grantAccess(productType, productId, userId);
          if (!granted) {
            throw new Error('Falha ao liberar acesso no banco de dados.');
          }

          console.log(`[Webhook Asaas] Acesso liberado: ${productType}/${productId} -> ${userId}`);

          // 9. Process Secondary Effects (Financial Logs, Emails, Affiliate)
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

            const customerEmail = verifiedPayment.customerEmail || body.payment?.customerEmail;
            if (customerEmail) {
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

              await triggerEmailEvent({
                event: 'payment_confirmed',
                to: customerEmail,
                data: {
                  name: userName,
                  amount: amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  payment_id: paymentId
                },
                idempotencyKey: `payment_${paymentId}`
              });
            }

            if (affiliateCode) {
              const { data: linkData } = await supabaseAdmin.from('affiliate_links').select('affiliate_id').eq('code', affiliateCode).maybeSingle();
              if (linkData) {
                const affiliateId = linkData.affiliate_id;
                const { data: affiliate } = await supabaseAdmin.from('affiliates').select('commission_rate').eq('id', affiliateId).eq('status', 'active').maybeSingle();
                if (affiliate) {
                  const commissionRate = affiliate.commission_rate || 30;
                  const commissionAmount = (amount * commissionRate) / 100;
                  const saleData: any = {
                    affiliate_id: affiliateId,
                    amount: amount,
                    commission: commissionAmount,
                    status: 'pending',
                    metadata: { payment_id: paymentId, customer_email: customerEmail },
                  };
                  if (productType === 'course') saleData.course_id = productId;
                  await supabaseAdmin.from('affiliate_sales').insert(saleData);
                  await supabaseAdmin.rpc('increment_affiliate_earnings', { aff_id: affiliateId, amount_to_add: commissionAmount });
                }
              }
            }
          } catch (secondaryError) {
            console.error('[Webhook Asaas] Erro em efeitos secundários (matrícula OK):', secondaryError);
          }

          // 10. Mark as Completed (Idempotency Success)
          await supabaseAdmin
            .from('asaas_webhook_events')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('event_id', body.id);


          return new Response(JSON.stringify({ received: true, processed: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('[Webhook Asaas] Erro crítico:', error);
          
          // Mark event as failed if we had a claim
          const eventId = (await request.clone().json().catch(() => ({}))).id;
          if (eventId) {
            await supabaseAdmin
              .from('asaas_webhook_events')
              .update({
                status: 'failed',
                last_error: error.message
              })
              .eq('event_id', eventId)
              .eq('status', 'processing'); // Only if we were the ones processing it
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


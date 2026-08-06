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
            const externalRef = body.payment?.externalReference; // Formato "type:id"
            if (externalRef && externalRef.includes(':')) {
              const [productType, productId] = externalRef.split(':');
              const customerEmail = body.payment?.customerEmail;

              // Identificar o usuário pelo e-mail se possível (o Asaas envia o e-mail do cliente)
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
                  } else if (productType === 'ebook') {
                    await supabaseAdmin.from('ebook_enrollments').upsert({
                      user_id: userId,
                      ebook_id: productId,
                    }, { onConflict: 'user_id,ebook_id' });
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

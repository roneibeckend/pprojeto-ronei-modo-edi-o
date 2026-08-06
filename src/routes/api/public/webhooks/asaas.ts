import { createFileRoute } from '@tanstack/react-router';

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
            status: body.payment?.status
          });

          // TODO: Validar token de segurança configurado na integração
          // TODO: Atualizar status do enrollment baseado no body.payment.externalReference ou metadata

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

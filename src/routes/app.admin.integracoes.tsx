import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/admin/integracoes')({
  head: () => ({ meta: [{ title: "Integrações — Painel Admin" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  return null; // Placeholder for plan
}

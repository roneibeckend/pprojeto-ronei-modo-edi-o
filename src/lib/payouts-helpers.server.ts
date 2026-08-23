import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { triggerEmailEvent } from "@/lib/resend.server";

export interface AdminRecipient {
  id: string;
  email: string;
  name: string;
}

/** Busca e-mails e ids de todos os administradores (para alertas de novos saques). */
export async function getAdminRecipients(): Promise<AdminRecipient[]> {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  const ids = (roles || []).map((r) => r.user_id);
  if (ids.length === 0) return [];

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email")
    .in("id", ids);

  return (profiles || [])
    .filter((p) => !!p.email)
    .map((p) => ({ id: p.id, email: p.email as string, name: (p.name as string) || "Admin" }));
}

/** Cria notificação interna para um usuário específico. */
export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const { data: notification, error } = await supabaseAdmin
    .from("notifications")
    .insert({ title, message, type: "payout", target_type: "segmented", metadata })
    .select("id")
    .single();

  if (error || !notification) return;

  await supabaseAdmin
    .from("user_notifications")
    .insert({ user_id: userId, notification_id: notification.id });
}

/** Cria notificação interna para todos os admins. */
export async function notifyAdmins(
  title: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const admins = await getAdminRecipients();
  if (admins.length === 0) return;

  const { data: notification, error } = await supabaseAdmin
    .from("notifications")
    .insert({ title, message, type: "payout", target_type: "segmented", metadata })
    .select("id")
    .single();

  if (error || !notification) return;

  await supabaseAdmin
    .from("user_notifications")
    .insert(admins.map((a) => ({ user_id: a.id, notification_id: notification.id })));
}

/** Dispara e-mail transacional do fluxo de saques. Falhas de e-mail nunca quebram o fluxo. */
export async function sendPayoutEmail(
  template: string,
  email: string | null | undefined,
  variables: Record<string, string>,
) {
  if (!email) return;
  try {
    await triggerEmailEvent(template, email, variables);
  } catch (err) {
    console.error(`[payouts] Falha ao enviar e-mail ${template} para ${email}:`, err);
  }
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateBR(date: Date = new Date()): string {
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

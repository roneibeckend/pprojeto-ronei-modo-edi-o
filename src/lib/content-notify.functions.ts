import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NotifySchema = z.object({
  contentType: z.enum(["ebook", "course"]),
  contentId: z.string().min(1),
  force: z.boolean().optional().default(false),
});

async function assertAdmin(context: any) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Acesso negado: permissão de administrador necessária.");
}

/**
 * Envia o e-mail de "novo conteúdo" (eBook ou curso) para todos os alunos
 * com e-mail cadastrado e que não desativaram notificações.
 * Registra o disparo em content_notifications para evitar reenvio acidental.
 */
export const notifyNewContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => NotifySchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { triggerEmailEvent } = await import("./resend.server");

    const table = data.contentType === "ebook" ? "ebooks" : "courses";
    const { data: content, error: contentError } = await supabaseAdmin
      .from(table)
      .select("id, title, description")
      .eq("id", data.contentId)
      .maybeSingle();

    if (contentError) throw new Error(contentError.message);
    if (!content) throw new Error("Conteúdo não encontrado.");

    const { data: already } = await supabaseAdmin
      .from("content_notifications")
      .select("id, created_at, sent_count")
      .eq("content_type", data.contentType)
      .eq("content_id", data.contentId)
      .maybeSingle();

    if (already && !data.force) {
      return {
        success: false,
        alreadySent: true,
        sentAt: already.created_at,
        sentCount: already.sent_count,
        message: "Este conteúdo já foi anunciado por e-mail.",
      };
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, email_notifications_opt_in")
      .not("email", "is", null)
      .limit(5000);

    if (studentsError) throw new Error(studentsError.message);

    const recipients = (students || []).filter(
      (s: any) => s.email && s.email_notifications_opt_in !== false,
    );

    const event = data.contentType === "ebook" ? "new_ebook" : "new_course";
    const link =
      data.contentType === "ebook"
        ? `https://ronneinaveia.com.br/app/ebooks/${content.id}`
        : `https://ronneinaveia.com.br/app/cursos/${content.id}`;

    const results = await Promise.allSettled(
      recipients.map((student: any) =>
        triggerEmailEvent({
          event,
          to: student.email,
          data: {
            name: student.name || "Aluno",
            title: content.title,
            description: content.description || undefined,
            link,
          },
          idempotencyKey: `${event}_${content.id}_${student.id}`,
        }),
      ),
    );

    const sentCount = results.filter((r) => r.status === "fulfilled").length;
    const firstError = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;

    await supabaseAdmin.from("content_notifications").upsert(
      {
        content_type: data.contentType,
        content_id: content.id,
        title: content.title,
        recipients_count: recipients.length,
        sent_count: sentCount,
        created_by: context.userId,
      } as any,
      { onConflict: "content_type,content_id" },
    );

    return {
      success: sentCount > 0,
      alreadySent: false,
      recipients: recipients.length,
      sentCount,
      error: sentCount === 0 ? String(firstError?.reason?.message || firstError?.reason || "") : undefined,
    };
  });

/** Lista os conteúdos que já tiveram e-mail de novidade enviado. */
export const listContentNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("content_notifications")
      .select("content_type, content_id, title, recipients_count, sent_count, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data || [];
  });

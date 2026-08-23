import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Downloads de e-book: registro do aceite de direitos autorais, rate limit
 * anti-abuso e e-mail imediato com o link do e-book (reduz compartilhamento
 * do arquivo original).
 */

export const registerEbookDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ebook_id: string; accepted: boolean; user_agent?: string }) => {
    const ebook_id = String(input?.ebook_id || "").trim();
    if (!ebook_id) throw new Error("E-book inválido.");
    return {
      ebook_id,
      accepted: input?.accepted === true,
      user_agent: String(input?.user_agent || "").slice(0, 400),
    };
  })
  .handler(async ({ data, context }) => {
    if (!data.accepted) {
      return { allowed: false, reason: "terms_not_accepted", message: "É necessário aceitar os termos de direitos autorais." };
    }

    const { data: result, error } = await context.supabase.rpc("register_ebook_download", {
      p_ebook_id: data.ebook_id,
      p_accepted: true,
      p_ip: undefined,
      p_user_agent: data.user_agent || undefined,
    });

    if (error) throw new Error(error.message);

    const payload = (result || {}) as Record<string, any>;
    if (!payload.allowed) {
      return {
        allowed: false,
        reason: String(payload.reason || "denied"),
        message: String(payload.message || "Download não permitido."),
      };
    }

    // E-mail imediato com o link do e-book online (melhor do que repassar o arquivo)
    let emailSent = false;
    try {
      if (payload.email) {
        const { triggerEmailEvent } = await import("@/lib/resend.server");
        const { LINKS } = await import("@/emails/layout");
        await triggerEmailEvent({
          event: "new_ebook",
          to: String(payload.email),
          data: {
            subject: `Seu acesso ao e-book: ${payload.ebook_title}`,
            name: String(payload.name || String(payload.email).split("@")[0]),
            title: String(payload.ebook_title || "E-book"),
            description:
              "Este é o seu link pessoal de leitura online. O PDF baixado é identificado com os seus dados e não pode ser compartilhado ou revendido.",
            link: `${LINKS.dashboard}/ebooks/${data.ebook_id}`,
          },
        });
        emailSent = true;
      }
    } catch (e) {
      console.error("[EbookDownload] Falha ao enviar e-mail com o link:", e);
    }

    try {
      const { logSystemEvent } = await import("@/lib/system-log.server");
      await logSystemEvent({
        level: "info",
        source: "ebook_download",
        message: `Download autorizado do e-book "${payload.ebook_title}" por ${payload.email}`,
        details: {
          ebook_id: data.ebook_id,
          user_id: context.userId,
          remaining_for_ebook: payload.remaining_for_ebook,
          remaining_today: payload.remaining_today,
          email_sent: emailSent,
        },
      });
    } catch (e) {}

    return {
      allowed: true,
      ebook_title: String(payload.ebook_title || ""),
      remaining_for_ebook: Number(payload.remaining_for_ebook ?? 0),
      remaining_today: Number(payload.remaining_today ?? 0),
      email_sent: emailSent,
    };
  });

export const listEbookDownloadLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { search?: string; from?: string; to?: string; limit?: number }) => ({
    search: String(input?.search || "").trim(),
    from: String(input?.from || "").trim(),
    to: String(input?.to || "").trim(),
    limit: Math.min(Math.max(Number(input?.limit ?? 500), 1), 2000),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("ebook_download_logs")
      .select("id, user_id, ebook_id, ebook_title, accepted_terms, accepted_at, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.from) query = query.gte("created_at", new Date(data.from).toISOString());
    if (data.to) {
      const end = new Date(data.to);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const list = rows || [];
    const userIds = Array.from(new Set(list.map((r: any) => r.user_id).filter(Boolean)));

    let profiles: Record<string, { name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profileRows } = await supabaseAdmin
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      for (const p of profileRows || []) {
        profiles[(p as any).id] = { name: (p as any).name, email: (p as any).email };
      }
    }

    let enriched = list.map((r: any) => ({
      ...r,
      student_name: profiles[r.user_id]?.name || null,
      student_email: profiles[r.user_id]?.email || null,
    }));

    if (data.search) {
      const needle = data.search.toLowerCase();
      enriched = enriched.filter((r) =>
        [r.student_name, r.student_email, r.ebook_title, r.ebook_id, r.user_id]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }

    return {
      rows: enriched,
      total: enriched.length,
      unique_students: new Set(enriched.map((r) => r.user_id)).size,
    };
  });

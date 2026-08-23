import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const confirmSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Informe o código de 6 dígitos enviado por e-mail."),
});

/** Janela e limites de reenvio de código. */
const RESEND_COOLDOWN_MS = 60_000; // 1 minuto entre códigos
const RESEND_WINDOW_MS = 60 * 60_000; // janela de 1 hora
const RESEND_MAX_PER_WINDOW = 5; // no máximo 5 códigos por hora
const CODE_TTL_MS = 30 * 60_000; // código válido por 30 minutos

type ResendState = {
  cooldownSeconds: number;
  remainingInWindow: number;
  maxPerWindow: number;
  windowResetSeconds: number;
  hasPendingCode: boolean;
  pendingExpiresAt: string | null;
};

function buildResendState(rows: Array<{ created_at: string; expires_at: string; consumed_at: string | null }>): ResendState {
  const now = Date.now();
  const inWindow = rows.filter((r) => now - new Date(r.created_at).getTime() < RESEND_WINDOW_MS);
  const last = rows[0];
  const oldestInWindow = inWindow[inWindow.length - 1];

  const cooldownMs = last ? RESEND_COOLDOWN_MS - (now - new Date(last.created_at).getTime()) : 0;
  const windowResetMs = oldestInWindow
    ? RESEND_WINDOW_MS - (now - new Date(oldestInWindow.created_at).getTime())
    : 0;

  const pending = rows.find(
    (r) => !r.consumed_at && new Date(r.expires_at).getTime() > now,
  );

  return {
    cooldownSeconds: Math.max(0, Math.ceil(cooldownMs / 1000)),
    remainingInWindow: Math.max(0, RESEND_MAX_PER_WINDOW - inWindow.length),
    maxPerWindow: RESEND_MAX_PER_WINDOW,
    windowResetSeconds: Math.max(0, Math.ceil(windowResetMs / 1000)),
    hasPendingCode: !!pending,
    pendingExpiresAt: pending?.expires_at ?? null,
  };
}

/** Área correta do usuário depois de confirmar o e-mail. */
async function resolveDestination(
  supabaseAdmin: any,
  userId: string,
): Promise<{ to: string; label: string }> {
  const { data: roleRow } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = roleRow?.role as string | undefined;
  if (role && role !== "student") {
    return { to: "/admin", label: "Painel administrativo" };
  }

  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, status")
    .eq("id", userId)
    .maybeSingle();

  if (affiliate?.status === "active") {
    return { to: "/app/afiliados", label: "Área de afiliados" };
  }

  return { to: "/app", label: "Área do aluno" };
}

/** Situação da confirmação de e-mail do usuário logado, incluindo limites de reenvio. */
export const getEmailVerificationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data } = await context.supabase
      .from("profiles")
      .select("email, email_verified_at")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: rows } = await supabaseAdmin
      .from("email_verifications")
      .select("created_at, expires_at, consumed_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const verified = !!data?.email_verified_at;

    return {
      email: (data?.email as string | null) ?? null,
      verified,
      verifiedAt: (data?.email_verified_at as string | null) ?? null,
      destination: verified ? await resolveDestination(supabaseAdmin, context.userId) : null,
      resend: buildResendState((rows as any[]) ?? []),
    };
  });

/** Gera e envia um código de 6 dígitos para o e-mail do usuário logado. */
export const sendEmailVerificationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, email, email_verified_at")
      .eq("id", context.userId)
      .maybeSingle();

    const email = (profile?.email as string | null) || (context.claims as any)?.email || null;
    if (!email) throw new Error("Nenhum e-mail encontrado no seu cadastro.");
    if (profile?.email_verified_at) {
      return {
        alreadyVerified: true as const,
        email,
        resend: buildResendState([]),
      };
    }

    const { data: rows } = await supabaseAdmin
      .from("email_verifications")
      .select("created_at, expires_at, consumed_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const state = buildResendState((rows as any[]) ?? []);

    if (state.cooldownSeconds > 0) {
      throw new Error(
        `Aguarde ${state.cooldownSeconds}s antes de solicitar um novo código.`,
      );
    }
    if (state.remainingInWindow <= 0) {
      const minutes = Math.max(1, Math.ceil(state.windowResetSeconds / 60));
      throw new Error(
        `Limite de ${RESEND_MAX_PER_WINDOW} códigos por hora atingido. Tente novamente em ${minutes} min.`,
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

    const { error } = await supabaseAdmin.from("email_verifications").insert({
      user_id: context.userId,
      email,
      code,
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);

    try {
      const { triggerEmailEvent } = await import("@/lib/resend.server");
      await triggerEmailEvent({
        event: "confirmacao_email",
        to: email,
        data: {
          name: (profile?.name as string | null) || email.split("@")[0],
          code,
          codigo: code,
          expires_in: "30 minutos",
        },
      });
    } catch (err) {
      console.error("[email-verification] Falha ao enviar código:", err);
      throw new Error("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
    }

    const isResend = ((rows as any[]) ?? []).length > 0;
    const attempt = RESEND_MAX_PER_WINDOW - state.remainingInWindow + 1;

    {
      const { logSystemEvent } = await import("@/lib/system-log.server");
      await logSystemEvent({
        level: "info",
        source: "email-verification",
        message: isResend
          ? `Código de confirmação reenviado para ${email} (tentativa ${attempt}/${RESEND_MAX_PER_WINDOW})`
          : `Código de confirmação enviado para ${email}`,
        details: {
          action: isResend ? "code_resent" : "code_sent",
          email,
          attempt,
          max_per_window: RESEND_MAX_PER_WINDOW,
          expires_at: expiresAt,
        },
        userId: context.userId,
      });
    }

    return {
      alreadyVerified: false as const,
      isResend,
      attempt,
      email,
      expiresAt,
      resend: {
        ...state,
        cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
        remainingInWindow: state.remainingInWindow - 1,
        hasPendingCode: true,
        pendingExpiresAt: expiresAt,
      },
    };

  });

/** Valida o código informado e marca o e-mail como confirmado. */
export const confirmEmailWithCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => confirmSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: record } = await supabaseAdmin
      .from("email_verifications")
      .select("id, code, expires_at, consumed_at")
      .eq("user_id", context.userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { logSystemEvent } = await import("@/lib/system-log.server");

    if (!record) throw new Error("Nenhum código pendente. Solicite um novo código.");
    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw new Error("Este código expirou. Solicite um novo código.");
    }
    if (record.code !== data.code) {
      await logSystemEvent({
        level: "warning",
        source: "email-verification",
        message: "Tentativa de confirmação de e-mail com código inválido",
        details: { action: "code_invalid", verification_id: record.id },
        userId: context.userId,
      });
      throw new Error("Código inválido. Confira o e-mail recebido.");
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("email_verifications")
      .update({ consumed_at: now })
      .eq("id", record.id);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ email_verified_at: now })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    const destination = await resolveDestination(supabaseAdmin, context.userId);

    await logSystemEvent({
      level: "info",
      source: "email-verification",
      message: `E-mail confirmado com sucesso${(context.claims as any)?.email ? `: ${(context.claims as any).email}` : ""}`,
      details: {
        action: "email_confirmed",
        verification_id: record.id,
        confirmed_at: now,
        destination: destination.to,
      },
      userId: context.userId,
    });

    return {
      verified: true as const,
      verifiedAt: now,
      destination,
    };

  });

/** Visão administrativa: usuários confirmados/pendentes + últimos eventos de verificação. */
export const getEmailVerificationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: z.enum(["all", "verified", "pending"]).optional(),
        limit: z.number().int().min(10).max(200).optional(),
      })
      .optional()
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const search = data?.search?.trim();
    const status = data?.status ?? "all";
    const limit = data?.limit ?? 50;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, name, email, email_verified_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (status === "verified") query = query.not("email_verified_at", "is", null);
    if (status === "pending") query = query.is("email_verified_at", null);

    const { data: users, error } = await query;
    if (error) throw new Error(error.message);

    const [{ count: verifiedCount }, { count: pendingCount }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("email_verified_at", "is", null),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .is("email_verified_at", null),
    ]);

    const { data: events } = await supabaseAdmin
      .from("email_verifications")
      .select("id, user_id, email, created_at, expires_at, consumed_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const now = Date.now();

    return {
      totals: {
        verified: verifiedCount ?? 0,
        pending: pendingCount ?? 0,
      },
      users: ((users as any[]) ?? []).map((u) => ({
        id: u.id as string,
        name: (u.name as string | null) ?? null,
        email: (u.email as string | null) ?? null,
        verifiedAt: (u.email_verified_at as string | null) ?? null,
        createdAt: u.created_at as string,
      })),
      events: ((events as any[]) ?? []).map((e) => ({
        id: e.id as string,
        userId: e.user_id as string,
        email: e.email as string,
        createdAt: e.created_at as string,
        state: e.consumed_at
          ? ("confirmed" as const)
          : new Date(e.expires_at).getTime() < now
            ? ("expired" as const)
            : ("pending" as const),
        consumedAt: (e.consumed_at as string | null) ?? null,
      })),
    };
  });

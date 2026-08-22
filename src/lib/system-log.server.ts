// Helper central de logging do sistema (server-only).
// Grava em public.system_logs usando o cliente admin (bypass RLS).

export type SystemLogLevel = "error" | "warning" | "info" | "debug";

export type SystemLogInput = {
  level: SystemLogLevel;
  source: string;
  message: string;
  details?: Record<string, unknown> | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logSystemEvent(input: SystemLogInput): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("system_logs").insert({
      level: input.level.toUpperCase(),
      source: input.source.slice(0, 80),
      message: String(input.message ?? "").slice(0, 2000),
      details: (input.details ?? {}) as never,
      user_id: input.userId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ? input.userAgent.slice(0, 500) : null,
    });
    if (error) {
      console.error("[system-log] insert error:", error.message);
      return error.message;
    }
    return null;
  } catch (err) {
    // Logging nunca pode quebrar o fluxo principal.
    console.error("[system-log] falha ao gravar log:", err);
    return String((err as Error)?.message ?? err);
  }
}

/** Loga um erro capturado em try/catch sem interromper o fluxo. */
export async function logSystemError(
  source: string,
  message: string,
  error: unknown,
  extra?: Record<string, unknown>,
): Promise<void> {
  const err = error as { message?: string; stack?: string } | undefined;
  await logSystemEvent({
    level: "error",
    source,
    message: `${message}${err?.message ? `: ${err.message}` : ""}`,
    details: { stack: err?.stack?.slice(0, 2000) ?? null, ...(extra ?? {}) },
  });
}

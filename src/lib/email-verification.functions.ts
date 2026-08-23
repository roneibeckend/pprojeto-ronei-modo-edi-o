import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const confirmSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Informe o código de 6 dígitos enviado por e-mail."),
});

/** Situação da confirmação de e-mail do usuário logado. */
export const getEmailVerificationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("email, email_verified_at")
      .eq("id", context.userId)
      .maybeSingle();

    return {
      email: (data?.email as string | null) ?? null,
      verified: !!data?.email_verified_at,
      verifiedAt: (data?.email_verified_at as string | null) ?? null,
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
    if (profile?.email_verified_at) return { alreadyVerified: true, email };

    // Limite simples: no máximo 1 código por minuto.
    const { data: recent } = await supabaseAdmin
      .from("email_verifications")
      .select("created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.created_at && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
      throw new Error("Aguarde 1 minuto antes de solicitar um novo código.");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

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

    return { alreadyVerified: false, email };
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

    if (!record) throw new Error("Nenhum código pendente. Solicite um novo código.");
    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw new Error("Este código expirou. Solicite um novo código.");
    }
    if (record.code !== data.code) throw new Error("Código inválido. Confira o e-mail recebido.");

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

    return { verified: true };
  });

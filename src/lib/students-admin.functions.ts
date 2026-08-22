import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteStudent = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ studentId: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logSystemEvent, logSystemError } = await import("@/lib/system-log.server");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Acesso negado: apenas administradores podem excluir alunos.");
    }

    if (data.studentId === context.userId) {
      throw new Error("Você não pode excluir a sua própria conta.");
    }

    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("id", data.studentId)
      .maybeSingle();

    try {
      // Referências sem ON DELETE CASCADE bloqueiam a remoção no Auth.
      await supabaseAdmin
        .from("integration_logs")
        .update({ user_id: null })
        .eq("user_id", data.studentId);
      await supabaseAdmin
        .from("notifications")
        .update({ sent_by: null })
        .eq("sent_by", data.studentId);
      await supabaseAdmin
        .from("support_tickets")
        .update({ assigned_to: null })
        .eq("assigned_to", data.studentId);

      // Remove a conta de autenticação (cascata remove profiles e dados vinculados)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.studentId);
      if (authError && !/not found|user not found/i.test(authError.message)) {
        throw new Error(authError.message);
      }

      // Garante remoção do perfil caso não exista conta de auth vinculada
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", data.studentId);
      if (profileError) throw new Error(profileError.message);

      // Verifica de fato se o registro sumiu antes de reportar sucesso
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("id", data.studentId);

      if ((count ?? 0) > 0) {
        throw new Error("O perfil ainda existe após a tentativa de exclusão.");
      }

      await logSystemEvent({
        level: "INFO",
        source: "alunos",
        message: `Aluno removido: ${target?.email ?? data.studentId}`,
        details: { studentId: data.studentId, name: target?.name ?? null },
        userId: context.userId,
      });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logSystemError(
        "alunos",
        `Falha ao remover aluno ${target?.email ?? data.studentId}`,
        err,
      );
      throw new Error("Erro ao excluir aluno: " + message);
    }
  });

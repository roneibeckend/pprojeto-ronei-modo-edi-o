import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteStudent = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ studentId: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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

    // Remove a conta de autenticação (cascata remove profiles e dados vinculados)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.studentId);

    if (authError && !/not found/i.test(authError.message)) {
      throw new Error("Erro ao excluir conta: " + authError.message);
    }

    // Garante remoção do perfil caso não exista conta de auth vinculada
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", data.studentId);

    if (profileError) {
      throw new Error("Erro ao excluir perfil: " + profileError.message);
    }

    return { success: true };
  });

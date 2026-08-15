// src/lib/ebook-visibility-fix.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fixEbookVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    ebook_id: z.string().uuid(),
    user_email: z.string().email().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // SECURITY: uses supabaseAdmin (bypasses RLS) — admin only.
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      throw new Error("Acesso negado: permissão de administrador necessária.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Ensure the ebook is unlocked
    const { error: ebookError } = await supabaseAdmin
      .from('ebooks')
      .update({ is_locked: false })
      .eq('id', data.ebook_id);

    if (ebookError) throw new Error("Error updating ebook: " + ebookError.message);

    // 2. Create a default module if none exists
    const { data: modules, error: fetchModError } = await supabaseAdmin
      .from('ebook_modules')
      .select('id')
      .eq('ebook_id', data.ebook_id);

    if (fetchModError) throw new Error("Error fetching modules: " + fetchModError.message);

    let moduleId;
    if (!modules || modules.length === 0) {
      const { data: newModule, error: modError } = await supabaseAdmin
        .from('ebook_modules')
        .insert({
          ebook_id: data.ebook_id,
          title: "Conteúdo Principal",
          order_index: 0
        })
        .select()
        .maybeSingle();
      if (modError || !newModule) throw new Error("Error creating module: " + (modError?.message || "Module creation returned no data"));
      moduleId = newModule.id;
    } else {
      moduleId = modules[0].id;
    }

    // 3. Create a default chapter if none exists
    const { data: chapters, error: fetchChapError } = await supabaseAdmin
      .from('ebook_chapters')
      .select('id')
      .eq('ebook_id', data.ebook_id);

    if (fetchChapError) throw new Error("Error fetching chapters: " + fetchChapError.message);

    if (!chapters || chapters.length === 0) {
      const { error: chapError } = await supabaseAdmin
        .from('ebook_chapters')
        .insert({
          ebook_id: data.ebook_id,
          module_id: moduleId,
          title: "Introdução",
          content: "<p>Bem-vindo ao ebook. O conteúdo está sendo processado e estruturado para você.</p>",
          order_index: 0
        });
      if (chapError) throw new Error("Error creating chapter: " + chapError.message);
    }

    // 4. Ensure enrollment for the user if email provided
    if (data.user_email) {
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) throw new Error("Error listing users: " + userError.message);

      const targetUser = users.users.find(u => u.email === data.user_email);
      if (targetUser) {
        const { error: enrollError } = await supabaseAdmin
          .from('ebook_enrollments')
          .upsert({
            user_id: targetUser.id,
            ebook_id: data.ebook_id
          });
        if (enrollError) console.warn("Error creating enrollment");
      }
    }

    return { success: true, ebook_id: data.ebook_id };
  });

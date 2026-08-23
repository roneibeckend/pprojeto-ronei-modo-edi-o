import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Proibido");
}

export const getEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().optional(),
        name: z.string().min(2),
        subject: z.string().min(2),
        content_html: z.string().min(10),
        content_text: z.string().optional(),
        description: z.string().optional(),
        variables: z.array(z.string()).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const payload: Record<string, any> = {
      name: data.name,
      subject: data.subject,
      content_html: data.content_html,
      content_text: data.content_text ?? null,
      description: data.description ?? null,
      variables: data.variables,
      updated_at: new Date().toISOString(),
    };
    if (data.id) payload.id = data.id;

    const { error } = await supabaseAdmin.from("email_templates").upsert(payload);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { error } = await supabaseAdmin.from("email_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

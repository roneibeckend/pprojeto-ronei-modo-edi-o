import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Tipagem genérica para contornar problemas de tipagem até o supabase ser atualizado
export const getEmailTemplates = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await (supabase as any)
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  });

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    subject: z.string().min(2),
    content_html: z.string().min(10),
    content_text: z.string().optional(),
    description: z.string().optional(),
    variables: z.array(z.string()).default([])
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await (supabase as any)
      .from('email_templates')
      .upsert({
        ...data,
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteEmailTemplate = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await (supabase as any)
      .from('email_templates')
      .delete()
      .eq('id', data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const saveLiveClass = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    scheduled_at: z.string(),
    link: z.string().optional(),
    materials_url: z.string().optional(),
    status: z.enum(['scheduled', 'live', 'completed']).default('scheduled'),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from('live_classes')
      .upsert({
        ...data,
        updated_at: new Date().toISOString()
      });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveContent = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    type: z.enum(['course', 'ebook']),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    is_ai_generated: z.boolean().default(false),
    content_url: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { type, ...payload } = data;
    const { error } = await supabaseAdmin
      .from(type === 'course' ? 'courses' : 'ebooks')
      .upsert(payload as any);
    if (error) throw new Error(error.message);
    return { success: true };
  });

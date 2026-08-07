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
      .upsert(data as any);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveContent = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    price: z.number().nullable().optional(),
    is_ai_generated: z.boolean().default(false),
    content_url: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    teacher_name: z.string().nullable().optional(),
    badge: z.string().nullable().optional(),
    is_locked: z.boolean().default(false),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from('courses')
      .upsert(data as any);
      
    if (error) throw new Error(error.message);
    return { success: true };
  });

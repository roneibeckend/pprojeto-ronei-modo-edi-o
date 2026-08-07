import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Tables = Database['public']['Tables'];

const EbookSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  cover: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  price: z.number().default(0),
  is_locked: z.boolean().default(false),
  category: z.string().optional().nullable(),
});

export const upsertEbook = createServerFn({ method: "POST" })
  .validator((data: any) => EbookSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase
      .from('ebooks')
      .upsert(data as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const getEbookEnrollments = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('ebook_enrollments')
      .select('ebook_id')
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
    return data.map(e => e.ebook_id);
  });

export const toggleChapterProgress = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    chapter_id: z.string().uuid(),
    completed: z.boolean()
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (data.completed) {
      const { error } = await supabase
        .from('ebook_progress')
        .upsert({
          user_id: user.id,
          chapter_id: data.chapter_id,
          completed_at: new Date().toISOString()
        });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('ebook_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('chapter_id', data.chapter_id);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

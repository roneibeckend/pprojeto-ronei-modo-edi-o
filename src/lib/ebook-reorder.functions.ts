import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const reorderChapter = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    chapterId: z.string().uuid(),
    newOrderIndex: z.number().min(0),
    moduleId: z.string().uuid()
  }).parse(data))
  .handler(async ({ data }) => {
    const { chapterId, newOrderIndex, moduleId } = data;

    // 1. Get all chapters in the module to calculate new positions
    const { data: chapters, error: fetchError } = await supabase
      .from('ebook_chapters')
      .select('id, order_index')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (fetchError) throw new Error(fetchError.message);

    const currentChapters = chapters || [];
    const movingChapter = currentChapters.find(c => c.id === chapterId);
    
    if (!movingChapter) throw new Error("Capítulo não encontrado");

    // 2. Remove moving chapter from list and insert at new index
    const otherChapters = currentChapters.filter(c => c.id !== chapterId);
    otherChapters.splice(newOrderIndex, 0, movingChapter);

    // 3. Prepare bulk update to avoid collisions (though manual order_index should be fine)
    // We'll update each chapter that actually changed its position
    const updates = otherChapters.map((chapter, index) => {
      if (chapter.order_index !== index) {
        return supabase
          .from('ebook_chapters')
          .update({ order_index: index })
          .eq('id', chapter.id);
      }
      return null;
    }).filter(Boolean);

    if (updates.length > 0) {
      const results = await Promise.all(updates);
      const firstError = results.find(r => r.error);
      if (firstError) throw new Error(firstError.error?.message);
    }

    return { success: true };
  });

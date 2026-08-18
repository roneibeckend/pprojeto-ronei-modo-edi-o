import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getEbookContent = createServerFn({ method: "GET" })
  .inputValidator((d: any) => d as string)
  .handler(async ({ data: ebookId }) => {
    // We use the regular client to check RLS, or we can use admin if we want to debug
    // For now, let's just use the regular client to see what the user sees
    const { data, error } = await supabase
      .from("ebooks")
      .select(`
        id, title,
        modules:ebook_modules (
          id, title, order_index,
          chapters:ebook_chapters (id, title, content, video_url, order_index)
        )
      `)
      .eq("id", ebookId)
      .single();

    if (error) {
      console.error("Error fetching ebook content:", error);
      return { error: error.message };
    }

    return { ebook: data };
  });

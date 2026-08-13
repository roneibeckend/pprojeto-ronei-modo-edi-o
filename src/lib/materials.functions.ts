import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getMaterials = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      console.log("Server side: Fetching platform_materials");
      const { data, error } = await supabase
        .from("platform_materials")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Server side: Error fetching platform_materials:", error);
        throw error;
      }
      
      console.log("Server side: Materials fetched:", data?.length || 0);
      return data || [];
    } catch (e) {
      console.error("Server side: Fatal error in getMaterials:", e);
      throw e;
    }
  });

export const upsertMaterial = createServerFn({ method: "POST" })
  .inputValidator((data: any) => z.object({
    id: z.string().uuid().optional(),
    title: z.string(),
    description: z.string().optional(),
    type: z.string(),
    file_url: z.string().optional(),
    external_url: z.string().optional(),
    category: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabase
      .from("platform_materials")
      .upsert({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const deleteMaterial = createServerFn({ method: "POST" })
  .inputValidator((data: any) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("platform_materials")
      .delete()
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });

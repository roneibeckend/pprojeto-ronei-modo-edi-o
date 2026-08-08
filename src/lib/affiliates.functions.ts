import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteAffiliateMaterial = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("affiliate_materials" as any)
      .delete()
      .eq("id", data.id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveAffiliateMaterial = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string(),
    file_url: z.string(),
    thumbnail_url: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("affiliate_materials" as any)
      .upsert(data);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getAffiliateNetwork = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: network, error } = await supabaseAdmin
      .from("affiliates")
      .select(`
        id,
        status,
        created_at,
        profile:profiles(name, email)
      `)
      .eq("referrer_id" as any, data.id);
    
    if (error) throw new Error(error.message);
    return network;
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteAffiliateMaterial = createServerFn({ method: "POST" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("affiliate_materials")
      .delete()
      .eq("id", data.id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveAffiliateMaterial = createServerFn({ method: "POST" })
  .input(z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string(),
    file_url: z.string(),
    thumbnail_url: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("affiliate_materials")
      .upsert(data);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getAffiliateNetwork = createServerFn({ method: "GET" })
  .input(z.object({ affiliateId: z.string() }))
  .handler(async ({ data }) => {
    const { data: network, error } = await supabaseAdmin
      .from("affiliates")
      .select(`
        id,
        status,
        created_at,
        profile:profiles(name, email)
      `)
      .eq("referrer_id", data.affiliateId);
    
    if (error) throw new Error(error.message);
    return network;
  });

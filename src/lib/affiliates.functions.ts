import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteAffiliateMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // 1. Check if user is admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    if (!isAdmin) {
      // 2. If not admin, verify ownership
      const { data: material } = await supabaseAdmin
        .from("affiliate_materials" as any)
        .select("owner_id")
        .eq("id", data.id)
        .maybeSingle();

      if (!material || (material as any).owner_id !== userId) {
        throw new Error("Acesso negado: Você não tem permissão para excluir este material.");
      }
    }

    const { error } = await supabaseAdmin
      .from("affiliate_materials" as any)
      .delete()
      .eq("id", data.id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveAffiliateMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string(),
    file_url: z.string(),
    thumbnail_url: z.string().optional(),
    owner_id: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // 1. Check if user is admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    let finalOwnerId = data.owner_id || userId;

    if (!isAdmin) {
      // If not admin, the owner MUST be the current user
      finalOwnerId = userId;

      // If updating, check existing ownership
      if (data.id) {
        const { data: existing } = await supabaseAdmin
          .from("affiliate_materials" as any)
          .select("owner_id")
          .eq("id", data.id)
          .maybeSingle();
        
        if (existing && (existing as any).owner_id !== userId) {
          throw new Error("Acesso negado: Você não pode alterar este material.");
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("affiliate_materials" as any)
      .upsert({
        ...data,
        owner_id: finalOwnerId,
        updated_at: new Date().toISOString()
      });
    
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

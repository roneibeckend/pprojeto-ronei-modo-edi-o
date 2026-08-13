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
    file_url: z.string().nullable().optional(),
    external_url: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
  }).parse(data))
  .handler(async ({ data }) => {
    // 1. Check for auth token in headers using the context injected by TanStack Start
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Server side: Auth error or user not found:", authError);
      throw new Error("Sessão expirada ou não autenticada (Não autenticado)");
    }



    const { data: hasRole } = await supabase.rpc("has_role", { 
      _user_id: user.id, 
      _role: "admin" 
    });

    if (!hasRole) throw new Error("Acesso negado: apenas administradores podem gerenciar materiais");

    // 2. Use the admin client to bypass RLS since we already verified the role
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: result, error } = await supabaseAdmin
      .from("platform_materials")
      .upsert({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar material (Admin Client):", error);
      throw error;
    }
    return result;
  });


export const deleteMaterial = createServerFn({ method: "POST" })
  .inputValidator((data: any) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Server side: Auth error or user not found:", authError);
      throw new Error("Sessão expirada ou não autenticada");
    }


    const { data: hasRole } = await supabase.rpc("has_role", { 
      _user_id: user.id, 
      _role: "admin" 
    });

    if (!hasRole) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("platform_materials")
      .delete()
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });


import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }) => {
    const { data: hasRole, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin" 
    });

    if (roleError) {
      console.error("Erro ao validar permissão para salvar material:", roleError);
      throw new Error("Não foi possível validar a permissão de administrador");
    }
    if (!hasRole) throw new Error("Acesso negado: apenas administradores podem gerenciar materiais");

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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: hasRole, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin" 
    });

    if (roleError) {
      console.error("Erro ao validar permissão para excluir material:", roleError);
      throw new Error("Não foi possível validar a permissão de administrador");
    }
    if (!hasRole) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("platform_materials")
      .delete()
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });

export const getMaterialDownloadUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({ filePath: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // filePath is expected to be just the name of the file in the 'platform-materials' bucket
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("platform-materials")
      .createSignedUrl(data.filePath, 60 * 5); // 5 minutes

    if (error) {
      console.error("Erro ao gerar URL assinada:", error);
      throw error;
    }

    return { url: signedData.signedUrl };
  });



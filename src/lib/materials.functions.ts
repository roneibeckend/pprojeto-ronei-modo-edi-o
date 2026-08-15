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
      .maybeSingle();

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
  .inputValidator((data: any) => z.object({ materialId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // 1. Fetch material to identify associations
    const { data: material, error: fetchError } = await supabaseAdmin
      .from("platform_materials")
      .select("*")
      .eq("id", data.materialId)
      .maybeSingle();

    if (fetchError || !material) {
      throw new Error("Material não encontrado.");
    }

    // 2. Authorization check
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    if (!isAdmin) {
    // Check if material is assigned to a course/ebook the user is enrolled in
    const mAny = material as any;
    if (mAny.course_id) {
        const { data: enrollment } = await supabaseAdmin
          .from("course_enrollments")
          .select("id")
          .eq("course_id", mAny.course_id)
          .eq("user_id", userId)
          .maybeSingle();
        
        if (!enrollment) throw new Error("Acesso negado: Você não possui matrícula neste curso.");
      } else if (mAny.ebook_id) {
        const { data: enrollment } = await supabaseAdmin
          .from("ebook_enrollments")
          .select("id")
          .eq("ebook_id", mAny.ebook_id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!enrollment) throw new Error("Acesso negado: Você não possui acesso a este e-book.");
      } else {

        // Generic material check if no specific association (maybe public if is_active)
        if (!material.is_active) throw new Error("Material indisponível.");
      }
    }

    // 3. Generate Signed URL
    const originalFileUrl = material.file_url;
    if (!originalFileUrl) throw new Error("Este material não possui um arquivo para download.");

    try {
      let bucketName = "platform-materials";
      let filePath = originalFileUrl;

      // Se o file_url for uma URL completa, extrair o bucket e o path
      if (originalFileUrl.startsWith('http')) {
        if (originalFileUrl.includes('/storage/v1/object/public/')) {
          const parts = originalFileUrl.split('/storage/v1/object/public/');
          const fullPath = parts[1]; // Ex: "platform-materials/filename.pdf"
          const firstSlash = fullPath.indexOf('/');
          if (firstSlash !== -1) {
            bucketName = fullPath.substring(0, firstSlash);
            filePath = fullPath.substring(firstSlash + 1);
          } else {
            bucketName = fullPath;
            filePath = ""; // Caso inválido, mas tratamos abaixo
          }
        } else {
          // Fallback para extrair apenas o nome do arquivo se for outra URL
          const simpleParts = originalFileUrl.split('/');
          filePath = simpleParts[simpleParts.length - 1];
        }
      }

      if (!filePath) throw new Error("Caminho do arquivo não identificado.");

      console.log(`Gerando link assinado para bucket: ${bucketName}, path: ${filePath}`);

      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 5); // 5 minutos

      if (signedError) {
        console.error("Erro ao gerar URL assinada:", signedError);
        throw new Error(`Erro no storage do provedor: ${signedError.message}`);
      }

      if (!signedData?.signedUrl) {
        throw new Error("O link de download não pôde ser gerado.");
      }

      return { url: signedData.signedUrl };
    } catch (e: any) {
      console.error("Erro fatal ao gerar link de download:", e);
      throw new Error(`Erro ao acessar o arquivo: ${e.message || 'Desconhecido'}`);
    }
  });




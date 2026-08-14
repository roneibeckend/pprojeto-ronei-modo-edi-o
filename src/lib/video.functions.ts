import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSignedVideoUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    path: z.string(),
    bucket: z.string().default("course-assets")
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // 1. Authorization Gate - Must be enrolled in some content using this video
    // This is a simplified check: is the user a student or admin?
    // In a strict mode, we'd map path -> course/ebook, but since we don't have a video registry table,
    // we at least ensure the user has SOME enrollment if they are a student.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    if (!isAdmin) {
      // Basic check: user must be enrolled in at least one course or ebook
      const { data: courseEnrolled } = await supabaseAdmin
        .from("course_enrollments")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      const { data: ebookEnrolled } = await supabaseAdmin
        .from("ebook_enrollments")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if ((!courseEnrolled || courseEnrolled.length === 0) && (!ebookEnrolled || ebookEnrolled.length === 0)) {
         throw new Error("Acesso negado: Nenhuma matrícula ativa encontrada.");
      }
    }

    // 2. Validate Path and Bucket
    const allowedBuckets = ["course-assets", "ebook-assets", "recipe-videos"];
    if (!allowedBuckets.includes(data.bucket)) {
      throw new Error("Acesso negado: Bucket não autorizado.");
    }

    // Prevent path traversal
    if (data.path.includes('..')) {
      throw new Error("Caminho inválido.");
    }

    let relativePath = data.path;
    // Extract relative path from potential full URLs
    if (data.path.includes('/storage/v1/object/public/')) {
        const parts = data.path.split(`${data.bucket}/`);
        if (parts.length > 1) {
            relativePath = parts[parts.length - 1];
        }
    } else if (data.path.includes('/storage/v1/object/sign/')) {
        const parts = data.path.split(`${data.bucket}/`);
        if (parts.length > 1) {
            relativePath = parts[parts.length - 1].split('?')[0];
        }
    }
    
    // 3. Generate Signed URL
    const { data: signedData, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(relativePath, 21600); // 6 hours

    if (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Falha ao gerar URL de acesso ao vídeo.");
    }

    return { signedUrl: signedData.signedUrl };
  });


import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSignedVideoUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({ 
    lessonId: z.string().uuid().optional(),
    chapterId: z.string().uuid().optional(),
    contentId: z.string().uuid().optional(),
    contentType: z.enum(['course', 'ebook']).optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    let storagePath: string | null = null;
    let targetCourseId: string | null = null;
    let targetEbookId: string | null = null;

    // 1. Resolve storage path and content association
    if (data.lessonId) {
      const { data: lesson } = await supabaseAdmin
        .from("course_lessons")
        .select("video_url, module:course_modules(course_id)")
        .eq("id", data.lessonId)
        .single();
      
      if (!lesson || !lesson.video_url) throw new Error("Aula ou vídeo não encontrado.");
      storagePath = lesson.video_url;
      targetCourseId = (lesson.module as any)?.course_id;
    } 
    else if (data.chapterId) {
      const { data: chapter } = await supabaseAdmin
        .from("ebook_chapters")
        .select("video_url, ebook_id")
        .eq("id", data.chapterId)
        .single();
      
      if (!chapter || !chapter.video_url) throw new Error("Capítulo ou vídeo não encontrado.");
      storagePath = chapter.video_url;
      targetEbookId = chapter.ebook_id;
    }
    else if (data.contentId && data.contentType) {
      if (data.contentType === 'course') {
        const { data: course } = await supabaseAdmin
          .from("courses")
          .select("intro_video_url")
          .eq("id", data.contentId)
          .single();
        if (!course || !course.intro_video_url) throw new Error("Vídeo de introdução não encontrado.");
        storagePath = course.intro_video_url;
        targetCourseId = data.contentId;
      } else if (data.contentType === 'ebook') {
        const { data: ebook } = await supabaseAdmin
          .from("ebooks")
          .select("opening_video_url")
          .eq("id", data.contentId)
          .single();
        if (!ebook || !ebook.opening_video_url) throw new Error("Vídeo de introdução não encontrado.");
        storagePath = ebook.opening_video_url;
        targetEbookId = data.contentId;
      }
    }

    if (!storagePath) {
      throw new Error("Acesso negado: Caminho de vídeo não vinculado a conteúdo válido.");
    }

    // 2. Authorization Gate
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    if (!isAdmin) {
      if (targetCourseId) {
        const { data: enrollment } = await supabaseAdmin
          .from("course_enrollments")
          .select("id")
          .eq("course_id", targetCourseId)
          .eq("user_id", userId)
          .maybeSingle();
        
        if (!enrollment) throw new Error("Acesso negado: Você não possui matrícula neste curso.");
      } else if (targetEbookId) {
        const { data: enrollment } = await supabaseAdmin
          .from("ebook_enrollments")
          .select("id")
          .eq("ebook_id", targetEbookId)
          .eq("user_id", userId)
          .maybeSingle();

        if (!enrollment) throw new Error("Acesso negado: Você não possui acesso a este e-book.");
      } else {
        // Safety: If somehow storagePath exists but no target was found, block.
        throw new Error("Acesso negado: Conteúdo não autorizado.");
      }
    }

    // 3. Final path cleaning and signing
    let relativePath = storagePath;
    // Derive bucket server-side ONLY
    const bucket = targetEbookId || data.chapterId ? "ebook-assets" : "course-assets";

    if (storagePath.includes('/storage/v1/object/public/')) {
        const parts = storagePath.split(`${bucket}/`);
        if (parts.length > 1) relativePath = parts[parts.length - 1];
    } else if (storagePath.includes('/storage/v1/object/sign/')) {
        const parts = storagePath.split(`${bucket}/`);
        if (parts.length > 1) relativePath = parts[parts.length - 1].split('?')[0];
    }
    
    // Strict normalization and safety
    if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.includes('://')) {
      throw new Error("Caminho de vídeo inválido ou malformado.");
    }

    const { data: signedData, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(relativePath, 21600); // 6 hours

    if (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Falha ao gerar URL de acesso ao vídeo.");
    }

    return { signedUrl: signedData.signedUrl };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { VideoBucket } from "./video.server";


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
    const { resolveStoredVideoLocation } = await import("./video.server");

    const userId = context.userId;

    let rawVideoUrl: string | null = null;
    let targetCourseId: string | null = null;
    let targetEbookId: string | null = null;
    let preferredBucket: VideoBucket = "course-assets";

    // 1. Fetch record from DB
    if (data.lessonId) {
      const { data: lesson } = await supabaseAdmin
        .from("course_lessons")
        .select("video_url, module:course_modules(course_id, course:courses(status))")
        .eq("id", data.lessonId)
        .maybeSingle();
      
      const courseStatus = (lesson as any)?.module?.course?.status;
      if (!lesson || !lesson.video_url || (courseStatus === 'draft' && !(await context.supabase.rpc("has_role", { _user_id: userId, _role: "admin" })).data)) throw new Error("Aula ou vídeo não encontrado.");
      rawVideoUrl = lesson.video_url;
      targetCourseId = (lesson.module as any)?.course_id;
      preferredBucket = "course-assets";
    } 
    else if (data.chapterId) {
      const { data: chapter } = await supabaseAdmin
        .from("ebook_chapters")
        .select("video_url, ebook_id, ebook:ebooks(status)")
        .eq("id", data.chapterId)
        .maybeSingle();
      
      const ebookStatus = (chapter as any)?.ebook?.status;
      if (!chapter || !chapter.video_url || (ebookStatus === 'draft' && !(await context.supabase.rpc("has_role", { _user_id: userId, _role: "admin" })).data)) throw new Error("Capítulo ou vídeo não encontrado.");
      rawVideoUrl = chapter.video_url;
      targetEbookId = chapter.ebook_id;
      preferredBucket = "ebook-assets";
    }
    else if (data.contentId && data.contentType) {
      if (data.contentType === 'course') {
        const { data: course } = await supabaseAdmin
          .from("courses")
          .select("intro_video_url, status")
          .eq("id", data.contentId)
          .maybeSingle();
        if (!course || !course.intro_video_url || (course.status === 'draft' && !(await context.supabase.rpc("has_role", { _user_id: userId, _role: "admin" })).data)) throw new Error("Vídeo de introdução não encontrado.");
        rawVideoUrl = course.intro_video_url;
        targetCourseId = data.contentId;
        preferredBucket = "course-assets";
      } else if (data.contentType === 'ebook') {
        const { data: ebook } = await supabaseAdmin
          .from("ebooks")
          .select("opening_video_url, status")
          .eq("id", data.contentId)
          .maybeSingle();
        if (!ebook || !ebook.opening_video_url || (ebook.status === 'draft' && !(await context.supabase.rpc("has_role", { _user_id: userId, _role: "admin" })).data)) throw new Error("Vídeo de introdução não encontrado.");
        rawVideoUrl = ebook.opening_video_url;
        targetEbookId = data.contentId;
        preferredBucket = "ebook-assets";
      }
    }

    if (!rawVideoUrl) {
      throw new Error("Nenhuma fonte de vídeo encontrada para o ID fornecido.");
    }

    // 2. Authorization Gate (Admin or Enrolled)
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
        throw new Error("Acesso negado: Conteúdo não autorizado.");
      }
    }

    // 3. Resolve physical location
    const resolved = await resolveStoredVideoLocation(
      supabaseAdmin,
      rawVideoUrl,
      preferredBucket
    );

    // 4. Generate the secure signed URL
    const { data: signedData, error } = await supabaseAdmin.storage
      .from(resolved.bucket)
      .createSignedUrl(resolved.path, 21600); // 6 hours

    if (error || !signedData?.signedUrl) {
      console.error("[VideoResolution] Error generating signed URL:", error);
      throw new Error("Falha ao gerar URL de acesso ao vídeo.");
    }

    return { signedUrl: signedData.signedUrl };
  });
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Internal helper to safely resolve the physical location of a video file.
 * Handles:
 * 1. Absolute Supabase URLs (public, sign, authenticated)
 * 2. Relative paths with cross-bucket fallback for legacy content.
 */
async function resolveStoredVideoLocation(
  supabaseAdmin: any,
  rawUrl: string,
  preferredBucket: "course-assets" | "ebook-assets"
): Promise<{ bucket: string; path: string }> {
  const VIDEO_BUCKETS = ["course-assets", "ebook-assets"];
  
  let bucket: string | null = null;
  let path: string | null = null;

  // Case 1: Absolute Supabase URL Parse
  if (rawUrl.startsWith("http")) {
    try {
      const url = new URL(rawUrl);
      const pathParts = url.pathname.split('/');
      
      const markerIndex = pathParts.findIndex(p => p === 'object');
      if (markerIndex !== -1 && pathParts.length > markerIndex + 2) {
        const detectedBucket = pathParts[markerIndex + 2];
        const detectedPath = pathParts.slice(markerIndex + 3).join('/');
        
        if (VIDEO_BUCKETS.includes(detectedBucket)) {
          bucket = detectedBucket;
          path = decodeURIComponent(detectedPath).split('?')[0].replace(/^\//, "");
        }
      }
    } catch (e) {
      console.error("[VideoResolution] Failed to parse absolute URL:", e);
    }
  } else {
    // Case 2: Relative Path
    path = rawUrl.split('?')[0].replace(/^\//, "");
    path = decodeURIComponent(path);
  }

  if (!path || path === "") {
    throw new Error("Caminho de vídeo malformado ou vazio.");
  }

  // Security: Block path traversal for ALL inputs (Absolute or Relative)
  if (path.includes('..') || path.includes('./')) {
    throw new Error("Caminho de vídeo inválido (traversal detectado).");
  }

  // Common verification for existence (Handles Absolute URL verify AND Relative fallback)
  const candidates = bucket 
    ? [bucket] // If we parsed a bucket from absolute URL, we must verify it exists there
    : [preferredBucket, ...VIDEO_BUCKETS.filter(b => b !== preferredBucket)];
    
  let resolvedBucket: string | null = null;
  let resolvedPath: string | null = null;

  for (const cand of candidates) {
    const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
    const fileName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path;

    // We don't use 'search' to avoid partial hits; we list and find exact match
    const { data: files } = await supabaseAdmin.storage
      .from(cand)
      .list(dir, { limit: 100 }); // List current directory
    
    if (files && files.length > 0) {
      const exactMatch = files.find((f: any) => f.name === fileName);
      if (exactMatch) {
        resolvedBucket = cand;
        resolvedPath = path;
        break;
      }
    }
  }

  if (!resolvedBucket || !resolvedPath) {
    throw new Error("Arquivo de vídeo não encontrado no armazenamento.");
  }

  // Safety layer re-validation
  if (!VIDEO_BUCKETS.includes(resolvedBucket)) {
    throw new Error("Localização de armazenamento não permitida.");
  }

  return { bucket: resolvedBucket, path: resolvedPath };
}

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

    let rawVideoUrl: string | null = null;
    let targetCourseId: string | null = null;
    let targetEbookId: string | null = null;
    let preferredBucket: "course-assets" | "ebook-assets" = "course-assets";

    // 1. Fetch record from DB to get the raw video source and verify ownership context
    if (data.lessonId) {
      const { data: lesson } = await supabaseAdmin
        .from("course_lessons")
        .select("video_url, module:course_modules(course_id)")
        .eq("id", data.lessonId)
        .single();
      
      if (!lesson || !lesson.video_url) throw new Error("Aula ou vídeo não encontrado.");
      rawVideoUrl = lesson.video_url;
      targetCourseId = (lesson.module as any)?.course_id;
      preferredBucket = "course-assets";
    } 
    else if (data.chapterId) {
      const { data: chapter } = await supabaseAdmin
        .from("ebook_chapters")
        .select("video_url, ebook_id")
        .eq("id", data.chapterId)
        .single();
      
      if (!chapter || !chapter.video_url) throw new Error("Capítulo ou vídeo não encontrado.");
      rawVideoUrl = chapter.video_url;
      targetEbookId = chapter.ebook_id;
      preferredBucket = "ebook-assets";
    }
    else if (data.contentId && data.contentType) {
      if (data.contentType === 'course') {
        const { data: course } = await supabaseAdmin
          .from("courses")
          .select("intro_video_url")
          .eq("id", data.contentId)
          .single();
        if (!course || !course.intro_video_url) throw new Error("Vídeo de introdução não encontrado.");
        rawVideoUrl = course.intro_video_url;
        targetCourseId = data.contentId;
        preferredBucket = "course-assets";
      } else if (data.contentType === 'ebook') {
        const { data: ebook } = await supabaseAdmin
          .from("ebooks")
          .select("opening_video_url")
          .eq("id", data.contentId)
          .single();
        if (!ebook || !ebook.opening_video_url) throw new Error("Vídeo de introdução não encontrado.");
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

    // 3. Resolve physical location (bucket and path)
    const resolved = await resolveStoredVideoLocation(supabaseAdmin, rawVideoUrl, preferredBucket);

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
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Normalizes a video path:
 * 1. Decodes URL components
 * 2. Removes query strings and leading slashes
 * 3. Splits into segments and blocks empty segments, "." or ".."
 */
function normalizeVideoPath(rawPath: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    throw new Error("Caminho de vídeo inválido.");
  }

  // Remove query params and leading slashes
  decoded = decoded.split("?")[0].replace(/^\/+/, "");

  const segments = decoded.split("/");
  
  if (
    segments.length === 0 ||
    segments.some(segment =>
      segment.length === 0 ||
      segment === "." ||
      segment === ".."
    )
  ) {
    throw new Error("Caminho de vídeo inválido.");
  }

  return segments.join("/");
}

/**
 * Paginates through storage to verify exact existence of a file.
 */
async function objectExists(
  supabaseAdmin: any,
  bucket: string,
  path: string
): Promise<boolean> {
  const lastSlashIndex = path.lastIndexOf('/');
  const dir = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
  const fileName = lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;

  const PAGE_SIZE = 100;
  let offset = 0;

  while (true) {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(dir, {
        limit: PAGE_SIZE,
        offset
      });

    if (error) {
      console.error(`[VideoResolution] Storage list error in ${bucket}/${dir}:`, error);
      throw new Error("Falha ao consultar armazenamento.");
    }

    if (files?.some((file: any) => file.name === fileName)) {
      return true;
    }

    if (!files || files.length < PAGE_SIZE) {
      return false;
    }

    offset += PAGE_SIZE;
  }
}

/**
 * Internal helper to safely resolve the physical location of a video file.
 */
async function resolveStoredVideoLocation(
  supabaseAdmin: any,
  rawUrl: string,
  preferredBucket: "course-assets" | "ebook-assets"
): Promise<{ bucket: string; path: string }> {
  const VIDEO_BUCKETS = ["course-assets", "ebook-assets"];
  const VALID_ACCESS_TYPES = ["public", "sign", "authenticated"];
  
  // Case 1: Absolute URL
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const url = new URL(rawUrl);
      const pathParts = url.pathname.split('/'); // e.g. ["", "storage", "v1", "object", "public", "bucket", "path..."]
      
      const markerIndex = pathParts.findIndex(p => p === 'object');
      if (markerIndex === -1 || pathParts.length <= markerIndex + 2) {
        throw new Error("Estrutura de URL absoluta inválida.");
      }

      const accessType = pathParts[markerIndex + 1];
      const detectedBucket = pathParts[markerIndex + 2];
      const rawPath = pathParts.slice(markerIndex + 3).join('/');

      if (!VALID_ACCESS_TYPES.includes(accessType)) {
        throw new Error(`Tipo de acesso inválido: ${accessType}`);
      }

      if (!VIDEO_BUCKETS.includes(detectedBucket)) {
        throw new Error(`Bucket não permitido: ${detectedBucket}`);
      }

      const normalizedPath = normalizeVideoPath(rawPath);
      
      const exists = await objectExists(supabaseAdmin, detectedBucket, normalizedPath);
      if (!exists) {
        throw new Error("Arquivo da URL absoluta não encontrado no armazenamento.");
      }

      return { bucket: detectedBucket, path: normalizedPath };
    } catch (e: any) {
      console.error("[VideoResolution] Absolute URL error:", e.message);
      throw new Error(e.message || "URL de vídeo inválida.");
    }
  }

  // Case 2: Relative Path
  const normalizedPath = normalizeVideoPath(rawUrl);
  
  // Try preferred bucket first, then fall back
  const buckets = [preferredBucket, ...VIDEO_BUCKETS.filter(b => b !== preferredBucket)];
  
  for (const bucket of buckets) {
    if (await objectExists(supabaseAdmin, bucket, normalizedPath)) {
      return { bucket, path: normalizedPath };
    }
  }

  throw new Error("Arquivo de vídeo não encontrado no armazenamento.");
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

    // 1. Fetch record from DB
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

    // 3. Resolve physical location
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

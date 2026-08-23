import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VIDEO_BUCKETS = ["course-assets", "ebook-assets"] as const;

type VideoBucket = (typeof VIDEO_BUCKETS)[number];

const VALID_VIDEO_ACCESS_TYPES = [
  "public",
  "sign",
  "authenticated",
] as const;

function isAllowedVideoBucket(bucket: string): bucket is VideoBucket {
  return (VIDEO_BUCKETS as readonly string[]).includes(bucket);
}

function normalizeVideoPath(rawPath: string): string {
  if (typeof rawPath !== "string" || rawPath.length === 0) {
    throw new Error("Caminho de vídeo inválido.");
  }

  const pathWithoutQuery = rawPath.split("?")[0];
  let decoded: string;

  try {
    decoded = decodeURIComponent(pathWithoutQuery);
  } catch {
    throw new Error("Caminho de vídeo inválido.");
  }

  if (decoded.includes("\\") || decoded.includes("\0")) {
    throw new Error("Caminho de vídeo inválido.");
  }

  decoded = decoded.replace(/^\/+/, "");

  if (!decoded) {
    throw new Error("Caminho de vídeo inválido.");
  }

  const segments = decoded.split("/");

  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".."
    )
  ) {
    throw new Error("Caminho de vídeo inválido.");
  }

  return segments.join("/");
}

async function objectExists(
  supabaseAdmin: any,
  bucket: VideoBucket,
  path: string
): Promise<boolean> {
  if (!isAllowedVideoBucket(bucket)) {
    throw new Error("Bucket de vídeo não permitido.");
  }

  const lastSlashIndex = path.lastIndexOf("/");
  const dir =
    lastSlashIndex >= 0
      ? path.substring(0, lastSlashIndex)
      : "";
  const fileName =
    lastSlashIndex >= 0
      ? path.substring(lastSlashIndex + 1)
      : path;

  if (!fileName) {
    throw new Error("Nome de arquivo de vídeo inválido.");
  }

  const PAGE_SIZE = 100;
  let offset = 0;

  while (true) {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(dir, {
        limit: PAGE_SIZE,
        offset,
        search: fileName,
      });

    if (error) {
      console.error("[VideoResolution] Storage lookup failed", {
        bucket,
        directoryPresent: !!dir,
      });
      throw new Error("Falha ao consultar armazenamento de vídeo.");
    }

    if (
      files?.some(
        (file: any) =>
          typeof file?.name === "string" &&
          file.name === fileName
      )
    ) {
      return true;
    }

    if (!files || files.length < PAGE_SIZE) {
      return false;
    }

    offset += PAGE_SIZE;
  }
}

async function resolveStoredVideoLocation(
  supabaseAdmin: any,
  rawUrl: string,
  preferredBucket: VideoBucket
): Promise<{ bucket: VideoBucket; path: string }> {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    throw new Error("Referência de vídeo inválida.");
  }

  const isAbsoluteUrl =
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://");

  if (isAbsoluteUrl) {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error("URL de vídeo inválida.");
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    if (
      parts.length < 6 ||
      parts[0] !== "storage" ||
      parts[1] !== "v1" ||
      parts[2] !== "object"
    ) {
      throw new Error(
        "Referência absoluta de vídeo não pertence ao Storage."
      );
    }

    const accessType = parts[3];
    const detectedBucket = parts[4];
    const rawPath = parts.slice(5).join("/");

    if (
      !(VALID_VIDEO_ACCESS_TYPES as readonly string[])
        .includes(accessType)
    ) {
      throw new Error(
        "Tipo de acesso da referência de vídeo inválido."
      );
    }

    if (!isAllowedVideoBucket(detectedBucket)) {
      throw new Error(
        "Bucket da referência de vídeo não permitido."
      );
    }

    const normalizedPath = normalizeVideoPath(rawPath);

    const exists = await objectExists(
      supabaseAdmin,
      detectedBucket,
      normalizedPath
    );

    if (!exists) {
      throw new Error(
        "Arquivo de vídeo não encontrado no armazenamento."
      );
    }

    return {
      bucket: detectedBucket,
      path: normalizedPath,
    };
  }

  const normalizedPath = normalizeVideoPath(rawUrl);
  const fallbackBucket: VideoBucket =
    preferredBucket === "ebook-assets"
      ? "course-assets"
      : "ebook-assets";

  const candidates: VideoBucket[] = [
    preferredBucket,
    fallbackBucket,
  ];

  for (const bucket of candidates) {
    const exists = await objectExists(
      supabaseAdmin,
      bucket,
      normalizedPath
    );

    if (exists) {
      return {
        bucket,
        path: normalizedPath,
      };
    }
  }

  // Last resort: the stored reference may carry a stale folder prefix
  // (e.g. "videos/clip.mp4" while the object lives at the bucket root).
  const baseName = normalizedPath.split("/").pop() ?? "";

  if (baseName && baseName !== normalizedPath) {
    for (const bucket of candidates) {
      const exists = await objectExists(
        supabaseAdmin,
        bucket,
        baseName
      );

      if (exists) {
        return { bucket, path: baseName };
      }
    }
  }

  throw new Error(
    "Arquivo de vídeo não encontrado no armazenamento."
  );
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
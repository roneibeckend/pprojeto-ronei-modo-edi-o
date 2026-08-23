// Helpers de resolução de vídeo no Storage (server-only).
// Mantidos fora de *.functions.ts para não serem removidos pelo split de server functions.

export const VIDEO_BUCKETS = ["course-assets", "ebook-assets"] as const;

export type VideoBucket = (typeof VIDEO_BUCKETS)[number];

const VALID_VIDEO_ACCESS_TYPES = ["public", "sign", "authenticated"] as const;

export function isAllowedVideoBucket(bucket: string): bucket is VideoBucket {
  return (VIDEO_BUCKETS as readonly string[]).includes(bucket);
}

export function normalizeVideoPath(rawPath: string): string {
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
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    )
  ) {
    throw new Error("Caminho de vídeo inválido.");
  }

  return segments.join("/");
}

export async function objectExists(
  supabaseAdmin: any,
  bucket: VideoBucket,
  path: string,
): Promise<boolean> {
  if (!isAllowedVideoBucket(bucket)) {
    throw new Error("Bucket de vídeo não permitido.");
  }

  const lastSlashIndex = path.lastIndexOf("/");
  const dir = lastSlashIndex >= 0 ? path.substring(0, lastSlashIndex) : "";
  const fileName = lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;

  if (!fileName) {
    throw new Error("Nome de arquivo de vídeo inválido.");
  }

  const PAGE_SIZE = 100;
  let offset = 0;

  while (true) {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(dir, { limit: PAGE_SIZE, offset, search: fileName });

    if (error) {
      console.error("[VideoResolution] Storage lookup failed", {
        bucket,
        directoryPresent: !!dir,
      });
      throw new Error("Falha ao consultar armazenamento de vídeo.");
    }

    if (
      files?.some(
        (file: any) => typeof file?.name === "string" && file.name === fileName,
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

export async function resolveStoredVideoLocation(
  supabaseAdmin: any,
  rawUrl: string,
  preferredBucket: VideoBucket,
): Promise<{ bucket: VideoBucket; path: string }> {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    throw new Error("Referência de vídeo inválida.");
  }

  const isAbsoluteUrl =
    rawUrl.startsWith("http://") || rawUrl.startsWith("https://");

  if (isAbsoluteUrl) {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error("URL de vídeo inválida.");
    }

    const parts = url.pathname.split("/").filter(Boolean);

    if (
      parts.length < 6 ||
      parts[0] !== "storage" ||
      parts[1] !== "v1" ||
      parts[2] !== "object"
    ) {
      throw new Error("Referência absoluta de vídeo não pertence ao Storage.");
    }

    const accessType = parts[3];
    const detectedBucket = parts[4];
    const rawPath = parts.slice(5).join("/");

    if (!(VALID_VIDEO_ACCESS_TYPES as readonly string[]).includes(accessType)) {
      throw new Error("Tipo de acesso da referência de vídeo inválido.");
    }

    if (!isAllowedVideoBucket(detectedBucket)) {
      throw new Error("Bucket da referência de vídeo não permitido.");
    }

    const normalizedPath = normalizeVideoPath(rawPath);
    const exists = await objectExists(supabaseAdmin, detectedBucket, normalizedPath);

    if (!exists) {
      throw new Error("Arquivo de vídeo não encontrado no armazenamento.");
    }

    return { bucket: detectedBucket, path: normalizedPath };
  }

  const normalizedPath = normalizeVideoPath(rawUrl);
  const fallbackBucket: VideoBucket =
    preferredBucket === "ebook-assets" ? "course-assets" : "ebook-assets";

  const candidates: VideoBucket[] = [preferredBucket, fallbackBucket];

  for (const bucket of candidates) {
    if (await objectExists(supabaseAdmin, bucket, normalizedPath)) {
      return { bucket, path: normalizedPath };
    }
  }

  // Última tentativa: a referência pode carregar um prefixo de pasta obsoleto.
  const baseName = normalizedPath.split("/").pop() ?? "";

  if (baseName && baseName !== normalizedPath) {
    for (const bucket of candidates) {
      if (await objectExists(supabaseAdmin, bucket, baseName)) {
        return { bucket, path: baseName };
      }
    }
  }

  throw new Error("Arquivo de vídeo não encontrado no armazenamento.");
}

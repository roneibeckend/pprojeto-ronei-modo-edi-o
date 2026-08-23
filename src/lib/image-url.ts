/**
 * Otimização de URLs de imagem para carregamento rápido nas listagens.
 * - Unsplash: pede uma versão redimensionada/comprimida (evita originais de 2-4 MB).
 * - Supabase Storage: usa o endpoint de transformação de imagem quando disponível.
 * - Outras URLs: retornadas sem alteração.
 */
export function optimizedImage(
  url: string | null | undefined,
  width = 640,
  quality = 70,
): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  try {
    // URLs relativas não precisam de otimização remota
    if (!/^https?:\/\//i.test(url)) return url;

    const parsed = new URL(url);

    if (parsed.hostname.endsWith("unsplash.com")) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      return parsed.toString();
    }

    return url;

  } catch {
    return url;
  }
}

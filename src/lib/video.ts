/**
 * Normalização de URLs de vídeo das aulas.
 *
 * Regras de segurança:
 * - Nunca renderizamos HTML vindo do banco (sem dangerouslySetInnerHTML).
 * - Só aceitamos provedores conhecidos (YouTube / Vimeo) ou arquivos de vídeo
 *   diretos servidos por HTTPS.
 * - Qualquer outra coisa é tratada como URL inválida pela interface.
 */

export type VideoSource =
  | { kind: "embed"; provider: "youtube" | "vimeo"; url: string }
  | { kind: "file"; url: string }
  | { kind: "none" }
  | { kind: "invalid" };

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"];
const VIMEO_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];
const FILE_EXT = /\.(mp4|webm|ogg|ogv|m3u8)$/i;

/** Extrai o ID do vídeo do YouTube a partir das formas de URL suportadas. */
function youtubeId(url: URL): string | null {
  if (url.hostname.endsWith("youtu.be")) {
    const id = url.pathname.slice(1).split("/")[0];
    return id || null;
  }
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") return parts[1] ?? null;
  return null;
}

/** Extrai o ID numérico do Vimeo. */
function vimeoId(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const numeric = parts.find((p) => /^\d+$/.test(p));
  return numeric ?? null;
}

export function resolveVideoSource(raw?: string | null): VideoSource {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) return { kind: "none" };

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { kind: "invalid" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return { kind: "invalid" };

  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.includes(host)) {
    const id = youtubeId(url);
    if (!id || !/^[\w-]{6,20}$/.test(id)) return { kind: "invalid" };
    return {
      kind: "embed",
      provider: "youtube",
      url: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
    };
  }

  if (VIMEO_HOSTS.includes(host)) {
    const id = vimeoId(url);
    if (!id) return { kind: "invalid" };
    return { kind: "embed", provider: "vimeo", url: `https://player.vimeo.com/video/${id}` };
  }

  if (FILE_EXT.test(url.pathname)) return { kind: "file", url: url.toString() };

  return { kind: "invalid" };
}

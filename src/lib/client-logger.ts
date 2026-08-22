import { recordClientLog } from "./system-log.functions";

type Level = "error" | "warning" | "info" | "debug";

let installed = false;
const recent = new Map<string, number>();
const DEDUPE_MS = 10_000;

function shouldSend(key: string) {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEDUPE_MS) return false;
  recent.set(key, now);
  if (recent.size > 50) recent.clear();
  return true;
}

export function logClient(
  level: Level,
  source: string,
  message: string,
  details?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  const msg = String(message ?? "").slice(0, 2000);
  if (!msg || !shouldSend(`${level}:${source}:${msg}`)) return;

  void recordClientLog({
    data: {
      level,
      source,
      message: msg,
      details: details ?? {},
      route: window.location.pathname,
    },
  }).catch(() => undefined);
}

/** Instala captura global de erros do navegador. */
export function installClientLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error;
    logClient("error", "browser", (event as ErrorEvent).message || String(err), {
      stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
      filename: (event as ErrorEvent).filename,
      line: (event as ErrorEvent).lineno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    logClient(
      "error",
      "browser",
      reason instanceof Error ? reason.message : String(reason),
      { stack: reason instanceof Error ? reason.stack?.slice(0, 2000) : undefined },
    );
  });
}

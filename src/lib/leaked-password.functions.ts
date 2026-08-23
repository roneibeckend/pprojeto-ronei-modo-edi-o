import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Verificação de senha vazada (proteção contra credential stuffing).
 *
 * Usa o modelo k-anonymity da API Pwned Passwords: apenas os 5 primeiros
 * caracteres do hash SHA-1 são enviados. A senha em texto puro nunca sai
 * do servidor e nunca é registrada em log.
 */
export const checkLeakedPassword = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const bytes = new TextEncoder().encode(data.password);
      const digest = await crypto.subtle.digest("SHA-1", bytes);
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { "Add-Padding": "true" },
      });
      if (!res.ok) return { leaked: false, count: 0, checked: false };

      const body = await res.text();
      for (const line of body.split("\n")) {
        const [hashSuffix, countRaw] = line.trim().split(":");
        if (hashSuffix === suffix) {
          const count = Number(countRaw ?? 0);
          if (count > 0) return { leaked: true, count, checked: true };
        }
      }

      return { leaked: false, count: 0, checked: true };
    } catch {
      // Falha de rede não deve bloquear o cadastro.
      return { leaked: false, count: 0, checked: false };
    }
  });

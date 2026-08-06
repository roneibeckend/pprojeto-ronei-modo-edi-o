import { createServerFn } from "@tanstack/react-start";

export type EbookSlide =
  | { type: "cover"; title: string; subtitle?: string; badge?: string }
  | { type: "chapter"; label: string; chapter: string; title: string; intro?: string }
  | { type: "content"; label: string; chapter?: string; title: string; body?: string; bullets?: string[] }
  | { type: "checklist"; label: string; chapter?: string; title: string; items: string[] }
  | { type: "tip"; label: string; chapter?: string; title: string; tip: string }
  | { type: "quote"; label: string; chapter?: string; quote: string; author?: string }
  | { type: "cta"; label: string; title: string; body?: string; button?: string };

export type Ebook = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  prompt: string;
  slides: EbookSlide[];
};

const SYSTEM = `Você é um autor especialista em criar ebooks premium, práticos e envolventes em português brasileiro para o nicho de espetinhos, churrasco e empreendedorismo gastronômico.

Ao receber um pedido, você retorna APENAS um JSON válido (sem markdown, sem comentários) no formato exato:

{
  "title": "string curta e forte (máx 60 chars)",
  "subtitle": "string com promessa clara (máx 120 chars)",
  "slides": [
    { "type": "cover", "title": "...", "subtitle": "...", "badge": "Ebook Premium" },
    { "type": "chapter", "label": "Curto p/ menu", "chapter": "Capítulo 1", "title": "...", "intro": "..." },
    { "type": "content", "label": "...", "chapter": "Capítulo 1", "title": "...", "body": "parágrafo 2-4 frases", "bullets": ["...", "..."] },
    { "type": "checklist", "label": "...", "chapter": "Capítulo 2", "title": "...", "items": ["item acionável 1", "item 2"] },
    { "type": "tip", "label": "...", "chapter": "Capítulo 2", "title": "Dica de ouro", "tip": "conselho prático curto" },
    { "type": "quote", "label": "...", "chapter": "Capítulo 3", "quote": "...", "author": "Ronnei" },
    { "type": "cta", "label": "Encerramento", "title": "...", "body": "...", "button": "..." }
  ]
}

Regras:
- Sempre gere entre 15 e 25 slides.
- Primeiro slide é OBRIGATORIAMENTE type "cover".
- Último slide é OBRIGATORIAMENTE type "cta".
- Distribua entre 3 e 6 capítulos, cada um começa com um slide "chapter" e é seguido por 2-5 slides de conteúdo variados (content, checklist, tip, quote).
- Alterne os tipos para manter ritmo — nunca 3 "content" seguidos.
- Linguagem direta, brasileira, tom Ronnei (parceiro, prático, motivador).
- Bullets curtos (máx 90 chars), acionáveis.
- Nunca invente dados falsos sobre pessoas reais. Nada de HTML, markdown ou emojis nos textos.
- Retorne APENAS o JSON, sem texto antes ou depois.`;

export const generateEbook = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const data = input as { prompt?: string };
    if (!data?.prompt || typeof data.prompt !== "string" || data.prompt.trim().length < 5) {
      throw new Error("Prompt muito curto");
    }
    return { prompt: data.prompt.trim().slice(0, 2000) };
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em alguns instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha ao gerar ebook (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: Omit<Ebook, "id" | "createdAt" | "prompt">;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("A IA não retornou JSON válido.");
      parsed = JSON.parse(match[0]);
    }

    if (!parsed?.slides?.length) throw new Error("A IA não retornou slides.");

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const ebook: Ebook = {
      id,
      title: parsed.title || "Ebook gerado",
      subtitle: parsed.subtitle || "",
      createdAt: new Date().toISOString(),
      prompt: data.prompt,
      slides: parsed.slides,
    };
    return ebook;
  });

export const generateChaptersForModules = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const data = input as { ebookTitle: string; modules: { id: string; title: string }[] };
    if (!data?.ebookTitle || !data?.modules?.length) {
      throw new Error("Título do ebook ou módulos ausentes");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    const prompt = `Ebook: "${data.ebookTitle}"
Módulos:
${data.modules.map((m, i) => `${i + 1}. ${m.title} (ID: ${m.id})`).join("\n")}

Com base no título do ebook e nos módulos acima, sugira entre 3 e 4 títulos de capítulos concisos, práticos e descritivos para CADA módulo.
FOCO: Nicho de espetinhos, churrasco, gestão de pequenos negócios gastronômicos e lucratividade.

Retorne APENAS um JSON no formato:
{
  "suggestions": [
    {
      "moduleId": "ID_DO_MODULO",
      "moduleTitle": "TITULO_DO_MODULO",
      "chapters": ["Título do Capítulo 1", "Título do Capítulo 2", ...]
    },
    ...
  ]
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { 
            role: "system", 
            content: "Você é um autor de ebooks especialista em gastronomia e negócios. Você retorna apenas JSON válido." 
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha ao gerar capítulos (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";
    
    try {
      return JSON.parse(content) as { 
        suggestions: { moduleId: string; moduleTitle: string; chapters: string[] }[] 
      };
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("A IA não retornou JSON válido.");
      return JSON.parse(match[0]);
    }
  });

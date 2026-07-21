import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { faqAsContext } from "@/lib/faq-knowledge";

type Body = { messages?: Array<{ role: "user" | "assistant"; content: string }> };

export const Route = createFileRoute("/api/bruna")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Missing messages", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.5-flash");

        const system = `Você é a Bruna, assistente virtual da plataforma Fidelize (programa de fidelidade por QR Code para estabelecimentos).

REGRAS:
- Responda SEMPRE em português do Brasil, tom acolhedor, profissional e direto.
- Use EXCLUSIVAMENTE a base de conhecimento abaixo. Não invente recursos, preços ou funcionalidades.
- Respostas curtas quando a pergunta for objetiva; use passo a passo (lista numerada) quando envolver navegação no sistema.
- Se a pergunta escapar totalmente da base, responda: "Ainda não encontrei essa informação na minha base de conhecimento. Posso encaminhar sua dúvida para nossa equipe de suporte." e ofereça o e-mail suporte@fidelize.com.
- Nunca peça dados sensíveis (senha, cartão). 
- Ao final, quando fizer sentido, sugira 1 ou 2 perguntas relacionadas prefixadas com "💡 ".

BASE DE CONHECIMENTO:
${faqAsContext()}`;

        const modelMessages: ModelMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = streamText({ model, system, messages: modelMessages });
        return result.toTextStreamResponse();
      },
    },
  },
});

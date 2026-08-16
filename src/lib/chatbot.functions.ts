import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getChatbotResponse = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    message: z.string(),
    context: z.record(z.any()).optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { message, context } = data;
    const lowerMessage = message.toLowerCase();

    // 1. Buscar na base de conhecimento
    const { data: knowledge, error } = await (supabase as any)
      .from('knowledge_base')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error("Erro ao buscar conhecimento:", error);
      return { 
        answer: "Desculpe, tive um problema técnico ao acessar minha base de conhecimento. Tente novamente em instantes.",
        confidence: "BAIXA",
        knowledgeId: null
      };
    }

    // 2. Lógica de Match (Intencionalidade)
    let bestMatch: any = null;
    let maxScore = 0;

    for (const item of (knowledge || []) as any[]) {
      let score = 0;
      
      // Checar perguntas exatas
      if (item.questions?.some((q: string) => q.toLowerCase() === lowerMessage)) {
        score += 100;
      }

      // Checar palavras-chave
      for (const kw of item.keywords || []) {
        if (lowerMessage.includes(kw.toLowerCase())) {
          score += 20;
        }
      }

      // Checar título
      if (lowerMessage.includes(item.title.toLowerCase())) {
        score += 10;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    // 3. Classificar confiança
    let confidence: "ALTA" | "MÉDIA" | "BAIXA" = "BAIXA";
    if (maxScore >= 80) confidence = "ALTA";
    else if (maxScore >= 30) confidence = "MÉDIA";

    // 4. Fallback se não encontrar
    if (!bestMatch || confidence === "BAIXA") {
      // Registrar dúvida não respondida (background)
      await (supabase as any).from('unhandled_questions').insert({
        question: message,
        confidence: maxScore / 100,
        context: context || {}
      });

      return {
        answer: "Não encontrei informação suficiente para responder isso com segurança. Posso encaminhar sua dúvida para o suporte humano ou você pode tentar reformular a pergunta.",
        confidence: confidence,
        knowledgeId: null,
        needsHuman: true
      };
    }

    return {
      answer: bestMatch.content,
      confidence: confidence,
      knowledgeId: bestMatch.id,
      needsHuman: false
    };
  });

export const submitKnowledgeFeedback = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    knowledgeId: z.string(),
    isPositive: z.boolean(),
    comment: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await (supabase as any)
      .from('knowledge_feedback')
      .insert({
        knowledge_id: data.knowledgeId,
        is_positive: data.isPositive,
        comment: data.comment
      });
    
    if (error) throw error;
    return { success: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Definindo tipos para evitar erros de 'never'
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  questions: string[] | null;
  keywords: string[] | null;
  status: string;
}

export const getChatbotResponse = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    message: z.string(),
    context: z.object({
      url: z.string().optional(),
      path: z.string().optional()
    }).optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { message, context: requestContext } = data;
    const query = message.toLowerCase();

    // 1. Buscar base de conhecimento
    const { data: knowledge, error } = await context.supabase
      .from("knowledge_base")
      .select("*")
      .eq("status", "active");

    if (error || !knowledge) {
      return {
        answer: "Desculpe, tive um problema ao acessar minha base de conhecimento. Tente novamente mais tarde.",
        confidence: 0,
        needsHuman: true
      };
    }

    // 2. Lógica de Matching
    let bestMatch: KnowledgeItem | null = null;
    let maxScore = 0;

    for (const item of (knowledge as KnowledgeItem[])) {
      let score = 0;
      
      // Peso 1: Palavras-chave
      const keywords = item.keywords || [];
      keywords.forEach(kw => {
        if (query.includes(kw.toLowerCase())) score += 0.3;
      });

      // Peso 2: Perguntas de variação
      const variations = item.questions || [];
      variations.forEach(v => {
        if (query.includes(v.toLowerCase()) || v.toLowerCase().includes(query)) score += 0.5;
      });

      // Peso 3: Título
      if (query.includes(item.title.toLowerCase())) score += 0.4;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    // Normalizar score (cap at 0.95)
    const confidence = Math.min(maxScore, 0.95);

    // 3. Resposta Baseada em Confiança
    if (bestMatch && confidence > 0.4) {
      return {
        answer: bestMatch.content,
        confidence,
        knowledgeId: bestMatch.id,
        needsHuman: confidence < 0.6
      };
    }

    // 4. Fallback: Gravar pergunta não respondida
    await context.supabase.from("unhandled_questions").insert({
      question: message,
      confidence,
      context: requestContext || {},
      status: 'pending'
    });

    return {
      answer: "Ainda estou aprendendo sobre isso e não tenho uma resposta exata. Você gostaria de falar com um atendente humano agora?",
      confidence,
      needsHuman: true
    };
  });

export const submitKnowledgeFeedback = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    knowledgeId: z.string(),
    isPositive: z.boolean()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("knowledge_feedback")
      .insert({
        knowledge_id: data.knowledgeId,
        is_positive: data.isPositive
      });
    
    if (error) throw error;
    return { success: true };
  });

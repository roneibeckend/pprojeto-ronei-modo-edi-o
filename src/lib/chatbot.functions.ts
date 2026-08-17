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
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    message: z.string(),
    context: z.object({
      url: z.string().optional(),
      path: z.string().optional()
    }).optional()
  }).parse(data))
  .handler(async ({ data, context }: { data: any, context: any }) => {
    const { message, context: requestContext } = data;
    
    // Normalização básica: minúsculas, remover acentos, pontuação, espaços extras
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^\w\s]/gi, "") // Remove pontuação
        .trim();
    };

    const query = normalize(message);

    if (!context) throw new Error("Internal Server Error: No context");

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

    // 2. Lógica de Matching em Camadas
    let bestMatch: KnowledgeItem | null = null;
    let maxScore = 0;

    for (const item of (knowledge as KnowledgeItem[])) {
      let score = 0;
      
      const titleNormalized = normalize(item.title);
      const variations = (item.questions || []).map(normalize);
      const keywords = (item.keywords || []).map(normalize);

      // Camada 1: Correspondência Exata em variações ou título (Boost Alto)
      if (variations.some(v => v === query) || titleNormalized === query) {
        score += 1.0;
      }

      // Camada 2: Contenção de Variações
      variations.forEach(v => {
        if (query.includes(v) || v.includes(query)) score += 0.6;
      });

      // Camada 3: Título contém query ou vice-versa
      if (query.includes(titleNormalized) || titleNormalized.includes(query)) score += 0.5;

      // Camada 4: Palavras-chave
      keywords.forEach(kw => {
        if (query.includes(kw)) score += 0.3;
      });

      // Camada 5: Contexto da Rota
      if (requestContext?.path) {
        const path = requestContext.path.toLowerCase();
        if (item.category === 'PWA' && path === '/app') score += 0.1;
        if (item.category === 'CURSOS' && path.includes('/cursos')) score += 0.1;
        if (item.category === 'EBOOKS' && path.includes('/ebooks')) score += 0.1;
        if (item.category === 'MATERIAIS' && path.includes('/materiais')) score += 0.1;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    // Normalizar score (cap at 1.0)
    const confidence = Math.min(maxScore, 1.0);

    // 3. Resposta Baseada em Confiança
    // Threshold reduzido para 0.3 para ser mais permissivo com sinônimos, mas exigindo feedback se < 0.6
    if (bestMatch && confidence > 0.3) {
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
      answer: "Ainda estou aprendendo sobre isso e não tenho uma resposta exata agora. Mas não se preocupe! Você pode abrir um chamado ou perguntar de outra forma.",
      confidence,
      needsHuman: true
    };
  });

export const submitKnowledgeFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({

    knowledgeId: z.string(),
    isPositive: z.boolean()
  }).parse(data))
  .handler(async ({ data, context }: { data: any, context: any }) => {
    if (!context) throw new Error("Internal Server Error: No context");
    const { error } = await context.supabase
      .from("knowledge_feedback")
      .insert({
        knowledge_id: data.knowledgeId,
        is_positive: data.isPositive
      });
    
    if (error) throw error;
    return { success: true };
  });

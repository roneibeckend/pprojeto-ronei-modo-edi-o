import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSEOSuggestions = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { title = "", description = "", keywords = "" } = data;
    
    const titleSuggestions: string[] = [];
    const descriptionSuggestions: string[] = [];
    const keywordSuggestions: string[] = [];
    
    // Title Analysis
    if (title.length > 0) {
      if (title.length < 40) {
        titleSuggestions.push("O título está curto. Considere usar entre 40 e 60 caracteres para melhor visibilidade no Google.");
      } else if (title.length > 60) {
        titleSuggestions.push("O título está longo. O Google pode cortá-lo em dispositivos móveis (ideal até 60 caracteres).");
      }
      
      const words = title.toLowerCase().split(/\s+/);
      const keywordList = keywords.toLowerCase().split(/,/).map(k => k.trim()).filter(Boolean);
      
      if (keywordList.length > 0) {
        const firstKeyword = keywordList[0];
        if (!title.toLowerCase().startsWith(firstKeyword)) {
          titleSuggestions.push(`Dica: Tente colocar sua palavra-chave principal ("${firstKeyword}") no início do título.`);
        }
      }
    }

    // Description Analysis
    if (description.length > 0) {
      if (description.length < 120) {
        descriptionSuggestions.push("A descrição está muito curta. Use entre 120 e 160 caracteres para atrair mais cliques.");
      } else if (description.length > 160) {
        descriptionSuggestions.push("A descrição está longa. O Google pode truncar o texto após 160 caracteres.");
      }
      
      const lowerDesc = description.toLowerCase();
      const hasCTA = /compre|aprenda|descubra|baixe|acesse|conheça|clique|garanta|confira/i.test(lowerDesc);
      
      if (!hasCTA) {
        descriptionSuggestions.push("Sugestão: Adicione uma chamada para ação (CTA) como 'Descubra mais', 'Aprenda agora' ou 'Garanta seu guia'.");
      }
      
      // Keyword Stuffing Check
      const words = lowerDesc.split(/\s+/);
      const wordCounts: Record<string, number> = {};
      words.forEach(w => {
        if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
      
      const stuffed = Object.entries(wordCounts).filter(([_, count]) => count > 5);
      if (stuffed.length > 0) {
        descriptionSuggestions.push("Cuidado com a repetição excessiva de palavras. Tente usar sinônimos para melhorar a legibilidade.");
      }
    }

    // Keywords Analysis
    if (keywords.length > 0) {
      const keywordList = keywords.split(/,/).map(k => k.trim()).filter(Boolean);
      
      if (keywordList.length < 5) {
        keywordSuggestions.push("Adicione mais palavras-chave. O ideal é ter entre 5 e 15 termos.");
      } else if (keywordList.length > 15) {
        keywordSuggestions.push("Muitas palavras-chave podem diluir a relevância. Tente focar nas 15 mais importantes.");
      }
      
      const shortKeywords = keywordList.filter(k => k.split(/\s+/).length < 2);
      if (shortKeywords.length > keywordList.length / 2) {
        keywordSuggestions.push("Dica: Use palavras-chave de cauda longa (3 ou mais palavras) para atrair público mais qualificado.");
      }
    }

    return {
      title: {
        score: title.length >= 40 && title.length <= 60 ? 'optimal' : (title.length > 0 ? 'warning' : 'empty'),
        suggestions: titleSuggestions
      },
      description: {
        score: description.length >= 120 && description.length <= 160 ? 'optimal' : (description.length > 0 ? 'warning' : 'empty'),
        suggestions: descriptionSuggestions
      },
      keywords: {
        score: keywords.split(',').filter(k => k.trim()).length >= 5 ? 'optimal' : (keywords.length > 0 ? 'warning' : 'empty'),
        suggestions: keywordSuggestions
      }
    };
  });

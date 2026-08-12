import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import * as pdf from "pdf-parse";

// Using require for pdf-parse if default import fails or to handle type mismatch
// @ts-ignore
const pdfParser = pdf.default || pdf;

interface ProcessedSection {
  title: string;
  content: string;
  order_index: number;
}

async function processPdfContent(buffer: Buffer): Promise<ProcessedSection[]> {
  let rawText = "";
  try {
    const data = await pdfParser(buffer);
    rawText = data.text;
    
    // Check if the content is an HTML error page
    if (rawText.includes("<!doctype html>") || rawText.includes("<html") || rawText.includes("This page didn't load")) {
      console.error("PDF service returned an HTML error page:", rawText);
      throw new Error("O serviço de PDF retornou uma página de erro técnica. Por favor, verifique se o arquivo PDF é válido e tente novamente.");
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("O PDF parece estar vazio ou não pôde ser lido.");
    }
    
    // Split by common chapter/section patterns
    const sections = rawText.split(/\n(?=(?:CAPÍTULO|MÓDULO|PARTE|CHAPTER|MODULE|SECTION)\s+\d+|[A-Z\s]{10,}\n\n)/i);
    
    return sections
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 50) 
      .map((content: string, index: number) => {
        const lines = content.split('\n');
        const title = lines[0].length < 100 ? lines[0].trim() : `Seção ${index + 1}`;
        const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : content;
        
        return {
          title,
          content: body.replace(/\n/g, '<br />'),
          order_index: index
        };
      });
  } catch (error: any) {
    // If it's already our custom error, rethrow it
    if (error.message && error.message.includes("O serviço de PDF")) {
      throw error;
    }
    console.error("Error parsing PDF:", error);
    throw new Error("Falha ao processar o arquivo PDF. Verifique se o arquivo não está corrompido.");
  }
}

export const importEbookFromPdf = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    ebook_id: z.string().uuid(),
    file_base64: z.string(), 
  }).parse(data))
  .handler(async ({ data }) => {
    const buffer = Buffer.from(data.file_base64.split(',')[1] || data.file_base64, 'base64');
    
    const processedSections = await processPdfContent(buffer);
    
    if (processedSections.length === 0) {
      throw new Error("Nenhum conteúdo estruturado encontrado no PDF.");
    }

    const { data: module, error: moduleError } = await supabase
      .from('ebook_modules')
      .insert({
        ebook_id: data.ebook_id,
        title: "Conteúdo Importado",
        order_index: 0
      })
      .select()
      .single();

    if (moduleError) throw new Error(moduleError.message);

    const chaptersToInsert = processedSections.map((section: ProcessedSection) => ({
      ebook_id: data.ebook_id,
      module_id: module.id,
      title: section.title,
      content: section.content,
      order_index: section.order_index
    }));

    const { error: chapterError } = await supabase
      .from('ebook_chapters')
      .insert(chaptersToInsert);

    if (chapterError) throw new Error(chapterError.message);

    return { 
      success: true, 
      chapters_count: processedSections.length 
    };
  });

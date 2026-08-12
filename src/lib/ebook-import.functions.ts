import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import * as pdf from "pdf-parse";

// Using require for pdf-parse if default import fails or to handle type mismatch
// @ts-ignore
let pdfParser: any;
try {
  // @ts-ignore
  pdfParser = pdf.default || pdf;
} catch (e) {
  console.error("Critical: Failed to initialize pdf-parse", e);
}

interface ProcessedSection {
  title: string;
  content: string;
  order_index: number;
}

// Memory-efficient text extractor (manual) if pdf-parse fails/is heavy
async function extractTextFromPdfMinimal(buffer: Buffer): Promise<string> {
  // This is a placeholder for a more robust manual extractor if needed.
  // For now, we rely on the library but with extreme protection.
  if (!pdfParser) {
    throw new Error("Mecanismo de PDF indisponível.");
  }
  const data = await pdfParser(buffer);
  return data?.text || "";
}

async function processPdfContent(buffer: Buffer): Promise<ProcessedSection[]> {
  let rawText = "";
  try {
    if (!pdfParser) {
      throw new Error("O mecanismo de processamento de PDF não foi inicializado corretamente.");
    }
    
    // Attempt to parse with a timeout (manual racing)
    const parsePromise = pdfParser(buffer);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT_PDF_INFRA")), 25000)
    );

    const data = await Promise.race([parsePromise, timeoutPromise]) as any;
    rawText = data?.text || "";
    
    // Check if the content is an HTML error page (the root cause of "This page didn't load" leaking)
    if (rawText.includes("<!doctype html>") || rawText.includes("<html") || rawText.includes("This page didn't load")) {
      console.error("PDF service returned an HTML error page inside the data result");
      throw new Error("INFRA_ERROR_HTML");
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("O PDF parece estar vazio ou não pôde ser lido.");
    }
    
    // Split by common chapter/section patterns
    // Refined regex to be less catastrophic on large strings
    const sections = rawText.split(/\n(?=(?:CAPÍTULO|MÓDULO|PARTE|CHAPTER|MODULE|SECTION)\s+\d+)/i);
    
    return sections
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 20) 
      .slice(0, 100) // Limit sections to prevent DB payload errors
      .map((content: string, index: number) => {
        const lines = content.split('\n');
        const title = lines[0].length < 100 ? lines[0].trim() : `Seção ${index + 1}`;
        const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : content;
        
        return {
          title: title || `Capítulo ${index + 1}`,
          content: body.replace(/\n/g, '<br />'),
          order_index: index
        };
      });
  } catch (error: any) {
    console.error("Detailed PDF processing error:", error);

    if (error.message === "TIMEOUT_PDF_INFRA") {
       throw new Error("O servidor demorou muito para processar este PDF. Tente um arquivo menor ou com menos imagens.");
    }

    if (error.message === "INFRA_ERROR_HTML" || error.message?.includes("<!doctype html>") || error.message?.includes("This page didn't load")) {
       throw new Error("Ocorreu uma instabilidade na infraestrutura ao tentar processar o arquivo. Isso geralmente acontece com PDFs muito pesados. Tente dividir o arquivo.");
    }

    if (error.message?.includes("fetch") || error.code === "ETIMEDOUT") {
       throw new Error("Erro de comunicação com o servidor. O arquivo pode ser grande demais.");
    }

    // If it's already our custom error, rethrow it
    if (error.message && (error.message.includes("PDF") || error.message.includes("mecanismo"))) {
      throw error;
    }
    
    throw new Error("Falha ao processar o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha.");
  }
}

export const importEbookFromPdf = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    ebook_id: z.string().uuid(),
    file_base64: z.string(), 
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      // Basic validation of base64 size to fail early if too large (e.g. > 10MB)
      // Base64 is roughly 1.37x the original file size. 13MB base64 is ~9.5MB file.
      if (data.file_base64.length > 13 * 1024 * 1024) {
        throw new Error("LIMITE_EXCEDIDO: O arquivo PDF excede o limite de 10MB para processamento automático. Tente dividir o PDF em partes menores.");
      }

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

      if (moduleError) throw new Error("Erro ao criar módulo: " + moduleError.message);

      const chaptersToInsert = processedSections.map((section: ProcessedSection) => ({
        ebook_id: data.ebook_id,
        module_id: module.id,
        title: section.title,
        content: section.content,
        order_index: section.order_index
      }));

      // Insert in chunks if there are many chapters
      const chunkSize = 20;
      for (let i = 0; i < chaptersToInsert.length; i += chunkSize) {
        const chunk = chaptersToInsert.slice(i, i + chunkSize);
        const { error: chapterError } = await supabase
          .from('ebook_chapters')
          .insert(chunk);
        if (chapterError) throw new Error("Erro ao inserir capítulos: " + chapterError.message);
      }

      return { 
        success: true, 
        chapters_count: processedSections.length 
      };
    } catch (err: any) {
      console.error("Server function error [importEbookFromPdf]:", err);
      // Ensure the error is clean and doesn't contain the HTML body if it leaked here
      const cleanMessage = err.message?.includes("<!doctype html>") 
        ? "Erro de infraestrutura (timeout). Tente um arquivo menor." 
        : err.message;
      throw new Error(cleanMessage || "Erro interno no servidor");
    }
  });
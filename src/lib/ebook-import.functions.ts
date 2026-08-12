import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import pdf from "pdf-parse";

// PDF Processing Helper (Server-side)
async function processPdfContent(buffer: Buffer) {
  try {
    const data = await pdf(buffer);
    const text = data.text;
    
    // Split by common chapter/section patterns
    // We look for patterns like "Capítulo", "Módulo", "Parte", or large uppercase titles followed by double newlines
    const sections = text.split(/\n(?=(?:CAPÍTULO|MÓDULO|PARTE|CHAPTER|MODULE|SECTION)\s+\d+|[A-Z\s]{10,}\n\n)/i);
    
    return sections
      .map(s => s.trim())
      .filter(s => s.length > 50) // Ignore small fragments
      .map((content, index) => {
        const lines = content.split('\n');
        const title = lines[0].length < 100 ? lines[0].trim() : `Seção ${index + 1}`;
        const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : content;
        
        return {
          title,
          content: body.replace(/\n/g, '<br />'), // Simple text to HTML conversion
          order_index: index
        };
      });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Falha ao processar o arquivo PDF.");
  }
}

export const importEbookFromPdf = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    ebook_id: z.string().uuid(),
    file_base64: z.string(), // We'll send base64 since it's a server function
  }).parse(data))
  .handler(async ({ data }) => {
    // 1. Decode PDF
    const buffer = Buffer.from(data.file_base64.split(',')[1] || data.file_base64, 'base64');
    
    // 2. Process content
    const processedSections = await processPdfContent(buffer);
    
    if (processedSections.length === 0) {
      throw new Error("Nenhum conteúdo estruturado encontrado no PDF.");
    }

    // 3. Create a default module if none exists or for the imported content
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

    // 4. Insert chapters
    const chaptersToInsert = processedSections.map(section => ({
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

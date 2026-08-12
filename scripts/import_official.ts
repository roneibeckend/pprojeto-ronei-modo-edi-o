import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import * as mammoth from "mammoth";
import * as fs from "fs";

const EBOOK_ID = "ee1a776c-6c7d-4a88-a980-7e671ad8d4fb";

async function run() {
  console.log("Iniciando atualização oficial do e-book...");
  
  const buffer = fs.readFileSync("/mnt/user-uploads/Espetinho_na_Veia_Importacao_Lovable_Leve.docx");
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  if (!html) throw new Error("Falha ao extrair HTML do DOCX");

  // Split by <h1> for modules/large sections or <h2> for chapters
  // Looking at the preview, <h1> seems to be used for "Sumário", "Boas-vindas", etc.
  // Let's split by <h1> and <h2> to create a flat or semi-flat structure
  const parts = html.split(/<h1[^>]*>/i).filter(p => p.trim().length > 0);
  
  console.log(`Encontradas ${parts.length} partes principais.`);

  // Clear existing structure (Keep the ebook row itself)
  // We'll delete chapters and modules. 
  // IMPORTANT: Since progress is tied to IDs, and we are replacing the entire book,
  // we accept that progress IDs won't match. But we MUST keep the ebook ID.
  
  console.log("Limpando estrutura antiga...");
  await supabaseAdmin.from('ebook_chapters').delete().eq('ebook_id', EBOOK_ID);
  await supabaseAdmin.from('ebook_modules').delete().eq('ebook_id', EBOOK_ID);

  // Create one main module for all content to keep it simple as requested
  const { data: module, error: modError } = await supabaseAdmin
    .from('ebook_modules')
    .insert({
      ebook_id: EBOOK_ID,
      title: "Conteúdo Oficial - Edição Revisada",
      order_index: 0
    })
    .select()
    .single();

  if (modError) throw modError;

  const chaptersToInsert = parts.map((part, index) => {
    // Extract title from the first line or before the first tag
    // The part starts right after <h1>, so the title is usually at the beginning
    const titleMatch = part.match(/^([^<]+)/);
    let title = titleMatch ? titleMatch[1].trim() : `Capítulo ${index + 1}`;
    
    // If title is "Sumário", we skip it as it's a digital book with its own navigation
    if (title.toLowerCase().includes("sumário")) return null;

    let content = part.replace(/^[^<]+/, '').trim();
    // Add some styling for tables and boxes if they exist
    content = content.replace(/<table>/g, '<div class="overflow-x-auto my-4"><table class="min-w-full border border-white/10 text-sm">');
    content = content.replace(/<td>/g, '<td class="border border-white/10 p-4">');
    
    return {
      ebook_id: EBOOK_ID,
      module_id: module.id,
      title: title,
      content: content,
      order_index: index
    };
  }).filter(Boolean);

  console.log(`Inserindo ${chaptersToInsert.length} capítulos...`);

  const { error: chapError } = await supabaseAdmin
    .from('ebook_chapters')
    .insert(chaptersToInsert);

  if (chapError) throw chapError;

  // Update Ebook metadata if needed
  await supabaseAdmin.from('ebooks').update({
    title: "Do zero aos 10K — Edição Revisada",
    subtitle: "O Guia Prático do Espetinho",
    description: "Versão oficial e ampliada do método Espetinho na Veia. Do Zero aos 10K com estratégia, padronização e escala."
  }).eq('id', EBOOK_ID);

  console.log("Atualização concluída com sucesso!");
}

run().catch(err => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});

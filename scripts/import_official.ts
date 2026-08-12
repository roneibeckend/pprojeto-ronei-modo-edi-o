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
  console.log("Limpando estrutura antiga...");
  await supabaseAdmin.from('ebook_chapters').delete().eq('ebook_id', EBOOK_ID);
  await supabaseAdmin.from('ebook_modules').delete().eq('ebook_id', EBOOK_ID);

  // Create one main module for all content
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
    // Extract title from <h1> text (the part after split starts with the content after <h1>)
    // But mammoth split puts the content after the tag in the part.
    // The previous <h1> text is lost in a standard split.
    // Let's use a better regex or manual parsing.
    
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
    // We already split by <h1>, so each part starts with the content AFTER <h1>.
    // Let's find titles using a better approach.
    return null;
  });

  // Better approach: use a loop to find all <h1> and its subsequent content
  const sections: {title: string, content: string}[] = [];
  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi));
  
  for (let i = 0; i < h1Matches.length; i++) {
    const title = h1Matches[i][1].replace(/<[^>]+>/g, '').trim();
    const startIdx = h1Matches[i].index! + h1Matches[i][0].length;
    const endIdx = i < h1Matches.length - 1 ? h1Matches[i+1].index! : html.length;
    let content = html.substring(startIdx, endIdx).trim();
    
    if (title.toLowerCase().includes("sumário")) continue;

    // Adapt styling
    content = content.replace(/<table>/g, '<div class="overflow-x-auto my-4"><table class="min-w-full border border-white/10 text-sm">');
    content = content.replace(/<td>/g, '<td class="border border-white/10 p-4">');
    content = content.replace(/<tr>/g, '<tr class="border-b border-white/5">');
    
    sections.push({ title, content });
  }

  console.log(`Inserindo ${sections.length} capítulos...`);

  const finalChapters = sections.map((s, index) => ({
    ebook_id: EBOOK_ID,
    module_id: module.id,
    title: s.title,
    content: s.content,
    order_index: index
  }));

  const { error: chapError } = await supabaseAdmin
    .from('ebook_chapters')
    .insert(finalChapters);

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

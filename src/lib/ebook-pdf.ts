import { jsPDF } from "jspdf";

/**
 * Geração do PDF do e-book com marca d'água de identificação do cliente
 * em TODAS as páginas (nome, e-mail, ID e data), além do aviso de direitos
 * autorais. Isso permite rastrear a origem de qualquer cópia distribuída.
 */

export interface EbookPdfChapter {
  title: string;
  content?: string | null;
}

export interface EbookPdfOwner {
  id: string;
  name: string;
  email: string;
}

export interface EbookPdfInput {
  title: string;
  subtitle?: string | null;
  chapters: EbookPdfChapter[];
  owner: EbookPdfOwner;
  brandName?: string;
}

type Block = { type: "h1" | "h2" | "h3" | "p" | "li"; text: string };

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 18;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const TOP_Y = 26;
const BOTTOM_Y = PAGE_H - 22;

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'");
}

/** Converte o HTML do capítulo em blocos simples de texto preservando a ordem. */
export function htmlToBlocks(html: string): Block[] {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");

  const blocks: Block[] = [];
  const regex = /<(h1|h2|h3|h4|h5|h6|p|li|blockquote|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned))) {
    const tag = match[1].toLowerCase();
    const text = decodeEntities(match[2].replace(/<[^>]+>/g, " "))
      .replace(/[ \t]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();
    if (!text) continue;

    const type: Block["type"] =
      tag === "h1" ? "h1" : tag === "h2" ? "h2" : tag.startsWith("h") ? "h3" : tag === "li" ? "li" : "p";
    blocks.push({ type, text });
  }

  if (!blocks.length) {
    const fallback = decodeEntities(cleaned.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (fallback) blocks.push({ type: "p", text: fallback });
  }

  return blocks;
}

function buildStamp(owner: EbookPdfOwner) {
  const when = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return {
    line: `Licença pessoal e intransferível · ${owner.name} · ${owner.email} · ID ${owner.id.slice(0, 8).toUpperCase()} · ${when}`,
    watermark: `${owner.email} · ${owner.id.slice(0, 8).toUpperCase()}`,
  };
}

/** Aplica marca d'água diagonal + rodapé de identificação na página atual. */
function stampPage(doc: jsPDF, stamp: ReturnType<typeof buildStamp>, pageNumber: number) {
  // Marca d'água diagonal (repetida) com os dados do cliente
  doc.saveGraphicsState();
  // @ts-expect-error GState existe em runtime no jsPDF
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  for (let y = 40; y < PAGE_H; y += 52) {
    doc.text(stamp.watermark, PAGE_W / 2, y, { align: "center", angle: 30 });
  }
  doc.restoreGraphicsState();

  // Rodapé com identificação e aviso legal
  doc.setDrawColor(225, 225, 228);
  doc.line(MARGIN_X, BOTTOM_Y + 2, PAGE_W - MARGIN_X, BOTTOM_Y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 115);
  doc.text(stamp.line, MARGIN_X, BOTTOM_Y + 7, { maxWidth: CONTENT_W - 12 });
  doc.text(
    "Reprodução, revenda ou compartilhamento proibidos (Lei 9.610/98).",
    MARGIN_X,
    BOTTOM_Y + 11,
  );
  doc.setTextColor(150, 150, 155);
  doc.text(String(pageNumber), PAGE_W - MARGIN_X, BOTTOM_Y + 11, { align: "right" });
}

export function generateEbookPdf(input: EbookPdfInput) {
  const brand = input.brandName || "Ronnei na Veia";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stamp = buildStamp(input.owner);
  let page = 1;
  let y = TOP_Y;

  const newPage = () => {
    stampPage(doc, stamp, page);
    doc.addPage();
    page += 1;
    y = TOP_Y;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM_Y - 6) newPage();
  };

  // ===== Capa =====
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(255, 106, 0);
  doc.rect(0, 96, PAGE_W, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(doc.splitTextToSize(input.title, CONTENT_W), MARGIN_X, 70);

  if (input.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(220, 220, 225);
    doc.text(doc.splitTextToSize(input.subtitle, CONTENT_W), MARGIN_X, 88);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 138, 61);
  doc.text(brand.toUpperCase(), MARGIN_X, 112);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(235, 235, 240);
  doc.text(
    doc.splitTextToSize(
      `Exemplar licenciado exclusivamente para ${input.owner.name} (${input.owner.email}).\n` +
        `Identificador do titular: ${input.owner.id}\n\n` +
        "AVISO DE DIREITOS AUTORAIS: este material é protegido pela Lei 9.610/98. " +
        "É proibida a reprodução total ou parcial, a revenda, a distribuição gratuita ou paga, " +
        "o compartilhamento em grupos, plataformas ou redes sociais e qualquer uso comercial sem " +
        "autorização expressa e por escrito do autor. Todas as páginas deste arquivo contêm a " +
        "identificação do titular acima, permitindo o rastreamento de cópias irregulares e a " +
        "responsabilização civil e criminal do infrator.",
      CONTENT_W,
    ),
    MARGIN_X,
    150,
  );

  stampPage(doc, stamp, page);

  // ===== Conteúdo =====
  doc.addPage();
  page += 1;
  y = TOP_Y;

  input.chapters.forEach((chapter, index) => {
    if (index > 0) newPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(20, 20, 22);
    const titleLines = doc.splitTextToSize(chapter.title || `Capítulo ${index + 1}`, CONTENT_W);
    ensureSpace(titleLines.length * 8 + 4);
    doc.text(titleLines, MARGIN_X, y);
    y += titleLines.length * 8 + 2;

    doc.setDrawColor(255, 106, 0);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_X, y, MARGIN_X + 24, y);
    doc.setLineWidth(0.2);
    y += 8;

    const blocks = chapter.content ? htmlToBlocks(chapter.content) : [];
    if (!blocks.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 125);
      doc.text("Este capítulo possui conteúdo em vídeo disponível na plataforma.", MARGIN_X, y);
      y += 8;
      return;
    }

    blocks.forEach((block) => {
      const isHeading = block.type === "h1" || block.type === "h2" || block.type === "h3";
      const size = block.type === "h1" ? 14 : block.type === "h2" ? 12.5 : block.type === "h3" ? 11.5 : 10.5;
      doc.setFont("helvetica", isHeading ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(isHeading ? 20 : 45, isHeading ? 20 : 45, isHeading ? 22 : 50);

      const prefix = block.type === "li" ? "•  " : "";
      const lines = doc.splitTextToSize(prefix + block.text, CONTENT_W - (block.type === "li" ? 4 : 0));
      const lineHeight = isHeading ? size * 0.55 : 5.4;

      lines.forEach((line: string) => {
        ensureSpace(lineHeight + 2);
        doc.text(line, MARGIN_X + (block.type === "li" ? 4 : 0), y);
        y += lineHeight;
      });
      y += isHeading ? 3.5 : 2.5;
    });
  });

  stampPage(doc, stamp, page);

  const slug = input.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  doc.save(`${slug || "ebook"}-${input.owner.id.slice(0, 8)}.pdf`);
}

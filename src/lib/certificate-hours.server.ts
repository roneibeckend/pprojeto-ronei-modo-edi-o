/**
 * Estimativa de carga horária de certificados.
 * Server-only: usa o client admin do Supabase.
 */

function toHours(minutes: number) {
  if (!minutes || minutes <= 0) return 1;
  return Math.max(1, Math.round(minutes / 60));
}

export async function estimateContentHours(
  contentId: string,
  contentType: "course" | "ebook",
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (contentType === "ebook") {
    const [{ data: chapters }, { data: ebook }] = await Promise.all([
      supabaseAdmin
        .from("ebook_chapters" as any)
        .select("reading_minutes, content")
        .eq("ebook_id", contentId),
      supabaseAdmin
        .from("ebooks" as any)
        .select("pages_count")
        .eq("id", contentId)
        .maybeSingle(),
    ]);

    const list = (chapters || []) as any[];
    const declared = list.reduce((s, c) => s + (Number(c.reading_minutes) || 0), 0);
    const chars = list.reduce((s, c) => s + String(c.content || "").length, 0);
    // ~200 palavras/min, ~5.5 caracteres por palavra
    const byText = Math.ceil(chars / 1100);
    const byPages = Math.ceil((Number((ebook as any)?.pages_count) || 0) * 1.5);
    const byChapters = list.length * 5;

    return toHours(Math.max(declared, byText, byPages, byChapters));
  }

  const { data: modules } = await supabaseAdmin
    .from("course_modules" as any)
    .select("id")
    .eq("course_id", contentId);

  const moduleIds = ((modules || []) as any[]).map((m) => m.id);
  if (moduleIds.length === 0) return 1;

  const { data: lessons } = await supabaseAdmin
    .from("course_lessons" as any)
    .select("duration_minutes")
    .in("module_id", moduleIds);

  const list = (lessons || []) as any[];
  const declared = list.reduce((s, l) => s + (Number(l.duration_minutes) || 0), 0);
  const byCount = list.length * 10;

  return toHours(Math.max(declared, byCount));
}

/**
 * Cálculo inteligente de carga horária (server-only).
 *
 * Não considera apenas tempo de leitura/vídeo: soma estudo, leitura,
 * execução, prática e implementação a partir da profundidade do conteúdo.
 */

export type WorkloadExtras = {
  exercises?: number;
  checklists?: number;
  spreadsheets?: number;
  materials?: number;
  practices?: number;
};

export type WorkloadSignals = {
  modules: number;
  chapters: number;
  lessons: number;
  pages: number;
  videos: number;
  videoMinutes: number;
  exercises: number;
  checklists: number;
  spreadsheets: number;
  materials: number;
  practices: number;
};

export type WorkloadSuggestion = {
  hours: number;
  minHours: number;
  maxHours: number;
  totalMinutes: number;
  signals: WorkloadSignals;
  breakdown: { label: string; minutes: number }[];
};

/** Pesos em minutos por unidade de conteúdo. */
const W = {
  page: 6, // leitura + assimilação
  chapter: 12, // revisão / anotações
  module: 20, // consolidação do módulo
  video: 15, // vídeo sem duração declarada
  lesson: 12, // aula sem duração declarada
  videoFactor: 1.6, // pausas, anotações e repetições sobre o tempo de vídeo
  exercise: 25,
  checklist: 20,
  spreadsheet: 40,
  material: 20,
  practice: 45,
};

function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
}

function countMatches(text: string, patterns: RegExp[]) {
  let total = 0;
  for (const re of patterns) total += (text.match(re) || []).length;
  return total;
}

/** Detecta materiais práticos citados no conteúdo (usado como padrão inicial). */
function detectPractical(text: string) {
  const t = text.toLowerCase();
  return {
    exercises: countMatches(t, [/exerc[íi]cio/g, /atividade proposta/g]),
    checklists: countMatches(t, [/checklist/g, /lista de verifica[çc][ãa]o/g]),
    spreadsheets: countMatches(t, [/planilha/g, /spreadsheet/g, /\.xlsx/g]),
    materials: countMatches(t, [/material complementar/g, /anexo/g, /download/g]),
    practices: countMatches(t, [/atividade pr[áa]tica/g, /pratique/g, /m[ãa]o na massa/g]),
  };
}

function hasVideo(url: unknown) {
  return typeof url === "string" && url.trim().length > 5;
}

function build(signals: WorkloadSignals): WorkloadSuggestion {
  const breakdown = [
    { label: "Leitura de páginas", minutes: Math.round(signals.pages * W.page) },
    { label: "Estudo por capítulos", minutes: Math.round(signals.chapters * W.chapter) },
    { label: "Consolidação por módulos", minutes: Math.round(signals.modules * W.module) },
    { label: "Videoaulas (com anotações)", minutes: Math.round(signals.videoMinutes * W.videoFactor) },
    { label: "Exercícios", minutes: Math.round(signals.exercises * W.exercise) },
    { label: "Checklists", minutes: Math.round(signals.checklists * W.checklist) },
    { label: "Planilhas", minutes: Math.round(signals.spreadsheets * W.spreadsheet) },
    { label: "Materiais complementares", minutes: Math.round(signals.materials * W.material) },
    { label: "Atividades práticas", minutes: Math.round(signals.practices * W.practice) },
  ].filter((b) => b.minutes > 0);

  const totalMinutes = breakdown.reduce((s, b) => s + b.minutes, 0);
  const hours = Math.max(1, Math.round(totalMinutes / 60));

  return {
    hours,
    minHours: Math.max(1, Math.floor(hours * 0.8)),
    maxHours: Math.max(hours, Math.ceil(hours * 1.35)),
    totalMinutes,
    signals,
    breakdown,
  };
}

export async function computeWorkload(
  contentId: string,
  contentType: "course" | "ebook",
  overrides?: WorkloadExtras,
): Promise<WorkloadSuggestion> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (contentType === "ebook") {
    const [{ data: ebook }, { data: modules }, { data: chapters }] = await Promise.all([
      supabaseAdmin
        .from("ebooks" as any)
        .select("pages_count, opening_video_url, video_url, workload_extras")
        .eq("id", contentId)
        .maybeSingle(),
      supabaseAdmin.from("ebook_modules" as any).select("id").eq("ebook_id", contentId),
      supabaseAdmin
        .from("ebook_chapters" as any)
        .select("content, video_url, reading_minutes")
        .eq("ebook_id", contentId),
    ]);

    const chapterList = ((chapters || []) as any[]) ?? [];
    const text = chapterList.map((c) => String(c.content || "")).join("\n");
    const detected = detectPractical(text);
    const stored = (((ebook as any)?.workload_extras || {}) as WorkloadExtras) ?? {};
    const extras = { ...detected, ...stored, ...(overrides || {}) };

    const chars = text.length;
    // ~1800 caracteres por página quando pages_count não está preenchido
    const pages = n((ebook as any)?.pages_count) || Math.ceil(chars / 1800);

    const videos =
      chapterList.filter((c) => hasVideo(c.video_url)).length +
      (hasVideo((ebook as any)?.opening_video_url) ? 1 : 0) +
      (hasVideo((ebook as any)?.video_url) ? 1 : 0);

    const declaredReading = chapterList.reduce((s, c) => s + n(c.reading_minutes), 0);

    const signals: WorkloadSignals = {
      modules: ((modules || []) as any[]).length,
      chapters: chapterList.length,
      lessons: 0,
      pages: Math.max(pages, Math.ceil(declaredReading / W.page)),
      videos,
      videoMinutes: videos * W.video,
      exercises: n(extras.exercises),
      checklists: n(extras.checklists),
      spreadsheets: n(extras.spreadsheets),
      materials: n(extras.materials),
      practices: n(extras.practices),
    };

    return build(signals);
  }

  const [{ data: course }, { data: modules }] = await Promise.all([
    supabaseAdmin
      .from("courses" as any)
      .select("intro_video_url, workload_extras")
      .eq("id", contentId)
      .maybeSingle(),
    supabaseAdmin.from("course_modules" as any).select("id, video_url").eq("course_id", contentId),
  ]);

  const moduleList = ((modules || []) as any[]) ?? [];
  const moduleIds = moduleList.map((m) => m.id);

  let lessonList: any[] = [];
  if (moduleIds.length > 0) {
    const { data: lessons } = await supabaseAdmin
      .from("course_lessons" as any)
      .select("duration_minutes, video_url, content")
      .in("module_id", moduleIds);
    lessonList = ((lessons || []) as any[]) ?? [];
  }

  const text = lessonList.map((l) => String(l.content || "")).join("\n");
  const detected = detectPractical(text);
  const stored = (((course as any)?.workload_extras || {}) as WorkloadExtras) ?? {};
  const extras = { ...detected, ...stored, ...(overrides || {}) };

  const declared = lessonList.reduce((s, l) => s + n(l.duration_minutes), 0);
  const undeclared = lessonList.filter((l) => !n(l.duration_minutes)).length;
  const videos =
    lessonList.filter((l) => hasVideo(l.video_url)).length +
    moduleList.filter((m) => hasVideo(m.video_url)).length +
    (hasVideo((course as any)?.intro_video_url) ? 1 : 0);

  const signals: WorkloadSignals = {
    modules: moduleList.length,
    chapters: 0,
    lessons: lessonList.length,
    pages: 0,
    videos,
    videoMinutes: declared + undeclared * W.lesson,
    exercises: n(extras.exercises),
    checklists: n(extras.checklists),
    spreadsheets: n(extras.spreadsheets),
    materials: n(extras.materials),
    practices: n(extras.practices),
  };

  // Aulas em texto (sem vídeo) contam como estudo/leitura
  const readingLessons = lessonList.length - lessonList.filter((l) => hasVideo(l.video_url)).length;
  signals.chapters = Math.max(0, readingLessons);

  return build(signals);
}

/** Carga horária final: valor manual do produto quando definido, senão a sugestão. */
export async function resolveWorkloadHours(
  contentId: string,
  contentType: "course" | "ebook",
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const table = contentType === "ebook" ? "ebooks" : "courses";
  const { data } = await supabaseAdmin
    .from(table as any)
    .select("workload_hours")
    .eq("id", contentId)
    .maybeSingle();

  const manual = n((data as any)?.workload_hours);
  if (manual > 0) return Math.round(manual);

  const suggestion = await computeWorkload(contentId, contentType);
  return suggestion.hours;
}

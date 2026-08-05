import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Check, 
  Lock, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  StickyNote, 
  Loader2,
  VideoOff
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { useCourses, useLessonProgress, useMarkLessonComplete } from "@/hooks/use-queries";
import { resolveVideoSource } from "@/lib/video";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cursos/$courseId")({
  head: () => ({
    meta: [
      { title: "Curso — Espetinho na Veia" },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { courseId } = Route.useParams();
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: progress, isLoading: loadingProgress } = useLessonProgress(courseId);
  const markComplete = useMarkLessonComplete();
  
  const course = courses?.find((c: any) => c.id === courseId);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"materiais" | "anotacoes">("materiais");
  const [note, setNote] = useState("");

  const flat = course?.modules?.flatMap((m: any) => m.lessons) || [];

  useEffect(() => {
    if (flat.length > 0 && !activeId) {
      setActiveId(flat[0].id);
    }
  }, [flat, activeId]);

  if (loadingCourses || loadingProgress) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <h2 className="font-display text-2xl font-bold">Curso não encontrado</h2>
        <Link to="/app/cursos" className="btn-fire mt-4 inline-flex">Voltar aos cursos</Link>
      </div>
    );
  }

  const active = flat.find((l: any) => l.id === activeId) ?? flat[0];
  const idx = flat.findIndex((l: any) => l.id === active?.id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  const isCompleted = progress?.some((p: any) => p.lesson_id === active?.id && p.is_completed);

  const handleToggleComplete = async () => {
    if (!active?.id) return;
    try {
      await markComplete.mutateAsync({
        lessonId: active.id,
        completed: !isCompleted,
      });
      toast.success(isCompleted ? "Aula marcada como não assistida" : "Aula concluída!");
    } catch (err) {
      toast.error("Erro ao atualizar progresso");
    }
  };

  return (
    <div>
      <PageHeader
        title={course.title}
        subtitle={`Professor: ${course.teacher_name || "Ronnei"} · Plataforma Espetinho na Veia`}
        action={<Link to="/app/cursos" className="btn-ghost-fire text-sm">← Todos os cursos</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player */}
        <div className="min-w-0 space-y-4">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="relative aspect-video bg-black">
              {(() => {
                const source = resolveVideoSource(active?.video_url);
                if (source.kind === "embed") {
                  return (
                    <iframe
                      key={source.url}
                      src={source.url}
                      title={active?.title || "Aula"}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                if (source.kind === "file") {
                  return <video key={source.url} src={source.url} controls playsInline className="h-full w-full" />;
                }
                return (
                  <div className="grid h-full w-full place-items-center bg-secondary/40 px-6 text-center">
                    <div>
                      <VideoOff className="mx-auto h-8 w-8 text-muted-foreground opacity-60" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        {source.kind === "invalid"
                          ? "O link de vídeo desta aula é inválido ou não é suportado."
                          : "Vídeo ainda não cadastrado para esta aula."}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {active?.duration && (
                <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs">
                  {active.duration}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Aula atual</div>
                <div className="font-display text-lg font-bold">{active?.title || "Selecione uma aula"}</div>
              </div>
              <button 
                onClick={handleToggleComplete}
                disabled={markComplete.isPending}
                className={`btn-fire text-sm ${isCompleted ? "bg-green-600 border-green-600 hover:bg-green-700" : ""}`}
              >
                {markComplete.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isCompleted ? "Concluída" : "Marcar como concluída"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              disabled={!prev}
              onClick={() => prev && setActiveId(prev.id)}
              className="btn-ghost-fire text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Aula anterior
            </button>
            <button
              disabled={!next}
              onClick={() => next && setActiveId(next.id)}
              className="btn-ghost-fire text-sm disabled:opacity-40"
            >
              Próxima aula <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setTab("materiais")}
                className={`rounded-full px-4 py-1.5 text-sm ${tab === "materiais" ? "bg-fire text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <FileText className="mr-1.5 inline h-3.5 w-3.5" /> Materiais
              </button>
              <button
                onClick={() => setTab("anotacoes")}
                className={`rounded-full px-4 py-1.5 text-sm ${tab === "anotacoes" ? "bg-fire text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <StickyNote className="mr-1.5 inline h-3.5 w-3.5" /> Anotações
              </button>
            </div>
            {tab === "materiais" ? (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between rounded-lg border border-white/5 p-3 text-muted-foreground">
                  Nenhum material disponível para esta aula.
                </li>
              </ul>
            ) : (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anote os pontos importantes desta aula..."
                className="min-h-40 w-full rounded-lg border border-white/10 bg-secondary/50 p-3 text-sm outline-none focus:border-primary"
              />
            )}
          </div>
        </div>

        {/* Modules */}
        <aside className="glass rounded-2xl p-4">
          <div className="mb-3 px-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Conteúdo do curso
          </div>
          <div className="space-y-4">
            {course.modules?.map((m: any) => (
              <div key={m.id}>
                <div className="px-2 pb-2 text-sm font-semibold">{m.title}</div>
                <ul className="space-y-1">
                  {m.lessons?.map((l: any) => {
                    const isActive = l.id === active?.id;
                    const lCompleted = progress?.some((p: any) => p.lesson_id === l.id && p.is_completed);
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => !l.is_locked && setActiveId(l.id)}
                          disabled={l.is_locked}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                            isActive ? "bg-fire/20 text-foreground" : "hover:bg-white/5"
                          } ${l.is_locked ? "opacity-50" : ""}`}
                        >
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${lCompleted ? "border-green-500 bg-green-500/20 text-green-500" : "border-white/10"}`}>
                            {l.is_locked ? <Lock className="h-3 w-3" /> : (lCompleted ? <Check className="h-3 w-3" /> : <Play className="h-3 w-3" />)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{l.duration}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock, Play, ChevronLeft, ChevronRight, FileText, StickyNote, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";

export const Route = createFileRoute("/app/cursos/$courseId")({
  head: ({ params }) => {
    return {
      meta: [
        { title: "Curso — Espetinho na Veia" },
      ],
    };
  },
  loader: async ({ params }) => {
    const { data: course, error } = await supabase
      .from("courses")
      .select(`
        *,
        modules (
          *,
          lessons (*)
        )
      `)
      .eq("id", params.courseId)
      .single();

    if (error || !course) throw notFound();
    return { course };
  },
  component: CoursePage,
});

function CoursePage() {
  const { course } = Route.useLoaderData();
  const navigate = useNavigate();
  const { isEnrolledInCourse, isLoading: isLoadingEnrollments } = useEnrollments();

  const isFree = (course.price || 0) === 0;
  const isEnrolled = isEnrolledInCourse(course.id);
  const hasAccess = isFree || isEnrolled;

  useEffect(() => {
    if (!isLoadingEnrollments && !hasAccess) {
      // Se não tem acesso, não redirecionamos bruscamente, apenas mostramos o estado bloqueado na UI
      // ou poderíamos redirecionar para a vitrine. Vamos manter na página mas mostrar o bloqueio.
    }
  }, [hasAccess, isLoadingEnrollments]);

  // Se não tem acesso, mostra tela de compra
  if (!isLoadingEnrollments && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-white/5 p-8 text-gold">
          <Lock className="h-16 w-16" />
        </div>
        <h2 className="font-display text-3xl font-black">{course.title}</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Este conteúdo é exclusivo para alunos deste treinamento. Adquira agora para liberar o acesso imediato.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link to="/app/cursos" className="btn-ghost-fire px-8 py-3 font-bold">
            Voltar aos cursos
          </Link>
          <button className="btn-fire px-10 py-3 font-bold shadow-lg shadow-fire/20">
            Comprar por R$ {course.price?.toString().replace(".", ",")}
          </button>
        </div>
      </div>
    );
  }

  // Lógica normal do curso
  const flat = course.modules?.flatMap((m: any) => m.lessons || []) || [];
  const [activeId, setActiveId] = useState<string | undefined>(flat[0]?.id);
  const [tab, setTab] = useState<"materiais" | "anotacoes">("materiais");
  const [note, setNote] = useState("");

  const active = flat.find((l: any) => l.id === activeId) ?? flat[0];
  const idx = flat.findIndex((l: any) => l.id === active?.id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  if (isLoadingEnrollments) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (!active) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <h2 className="font-display text-xl font-bold">Este curso ainda não possui aulas cadastradas.</h2>
        <Link to="/app/cursos" className="btn-fire mt-4 inline-flex">Voltar aos cursos</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={course.title}
        subtitle={`Professor: ${course.teacher_name || "Equipe Espetinho na Veia"}`}
        action={<Link to="/app/cursos" className="btn-ghost-fire text-sm">← Todos os cursos</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player */}
        <div className="min-w-0 space-y-4">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="relative aspect-video bg-black">
              <img src={course.cover_url || ""} alt="" className="h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 grid place-items-center">
                <button className="grid h-20 w-20 place-items-center rounded-full bg-fire shadow-fire transition hover:scale-105">
                  <Play className="h-8 w-8 text-white" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs">
                {active.duration || "00:00"}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Aula atual</div>
                <div className="font-display text-lg font-bold">{active.title}</div>
              </div>
              <button className="btn-fire text-sm">
                <Check className="h-4 w-4" /> Marcar como concluída
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
                <li className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                  <span>PDF · Guia rápido de temperos</span>
                  <button className="text-gold hover:underline">Baixar</button>
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
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => setActiveId(l.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                            isActive ? "bg-fire/20 text-foreground" : "hover:bg-white/5"
                          }`}
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10">
                            {isActive ? <Play className="h-3 w-3" /> : <Play className="h-3 w-3 opacity-50" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{l.duration || "00:00"}</span>
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

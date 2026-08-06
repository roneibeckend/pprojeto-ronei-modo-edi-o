import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { courses, student } from "@/lib/platform-data";
import { ProgressSummary } from "@/components/platform/ProgressSummary";

export const Route = createFileRoute("/app/cursos/")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  // Exibir apenas cursos adquiridos (locked: false)
  const owned = courses.filter((c) => !c.locked);

  // Cálculos para a barra de progresso
  const startedCount = owned.filter(c => c.progress > 0 && c.progress < 100).length;
  const finishedCount = owned.filter(c => c.progress === 100).length;
  
  // Média de progresso dos cursos adquiridos
  const totalProgress = owned.length > 0 
    ? Math.round(owned.reduce((acc, curr) => acc + curr.progress, 0) / owned.length)
    : 0;

  return (
    <div className="pb-10">
      <PageHeader
        title="Meus cursos"
        subtitle="Sua biblioteca pessoal de treinamentos adquiridos."
        action={
          <Link to="/app/cursos/preview" className="btn-ghost-fire text-sm">
            <Sparkles className="h-4 w-4" /> Ver previews interativas
          </Link>
        }
      />

      <ProgressSummary 
        totalProgress={totalProgress}
        startedCount={startedCount}
        finishedCount={finishedCount}
        streak={student.streak}
      />

      <section>
        <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Cursos em andamento e concluídos
        </h2>
        
        {owned.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {owned.map((c) => (
              <article key={c.id} className="glass card-tilt group overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-fire/30">
                <div className="relative aspect-video">
                  <img src={c.cover} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  
                  {c.badge && (
                    <div className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                      <Sparkles className="mr-1 inline h-3 w-3" /> {c.badge}
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                      {c.totalLessons} aulas
                    </div>
                    {c.progress === 100 && (
                      <div className="rounded-full bg-green-500/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                        Concluído
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-tight">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Progresso</span>
                      <span className={c.progress === 100 ? "text-green-500" : "text-gold"}>{c.progress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div 
                        className={`h-full transition-all duration-700 ${c.progress === 100 ? "bg-green-500" : "bg-gold"}`} 
                        style={{ width: `${c.progress}%` }} 
                      />
                    </div>
                  </div>
                  
                  <Link
                    to="/app/cursos/$courseId"
                    params={{ courseId: c.id }}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                      c.progress === 100 
                        ? "bg-white/5 text-white hover:bg-white/10" 
                        : "bg-fire text-white shadow-lg shadow-fire/20 hover:brightness-110"
                    }`}
                  >
                    {c.progress === 100 ? (
                      <>Revisar conteúdo</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" /> 
                        {c.progress > 0 ? "Continuar de onde parou" : "Iniciar treinamento"}
                      </>
                    )}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <div className="mb-4 rounded-full bg-white/5 p-6">
              <Sparkles className="h-10 w-10 text-gold/30" />
            </div>
            <h3 className="font-display text-xl font-bold">Nenhum curso adquirido ainda</h3>
            <p className="mt-2 max-w-xs text-muted-foreground">
              Visite a vitrine para descobrir treinamentos exclusivos e começar sua jornada.
            </p>
            <Link to="/app" className="btn-fire mt-8 px-8">
              Ir para Vitrine
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

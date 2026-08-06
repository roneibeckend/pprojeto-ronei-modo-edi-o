import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles, Lock, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { courses, student } from "@/lib/platform-data";
import { ProgressSummary } from "@/components/platform/ProgressSummary";

export const Route = createFileRoute("/app/cursos/")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  // Separar cursos adquiridos e disponíveis para compra
  const owned = courses.filter((c) => !c.locked);
  const others = courses.filter((c) => c.locked);

  // Cálculos para a barra de progresso (apenas para cursos adquiridos)
  const startedCount = owned.filter(c => c.progress > 0 && c.progress < 100).length;
  const finishedCount = owned.filter(c => c.progress === 100).length;
  
  const totalProgress = owned.length > 0 
    ? Math.round(owned.reduce((acc, curr) => acc + curr.progress, 0) / owned.length)
    : 0;

  return (
    <div className="pb-10">
      <PageHeader
        title="Meus cursos"
        subtitle="Gerencie seus treinamentos e descubra novos conteúdos."
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

      {/* Seção de Cursos Adquiridos */}
      <section className="mb-12">
        <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Seus Treinamentos
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
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center text-muted-foreground">
            Você ainda não possui nenhum curso liberado.
          </div>
        )}
      </section>

      {/* Seção de Cursos Disponíveis para Compra */}
      {others.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Disponíveis para Compra
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {others.map((c) => (
              <article key={c.id} className="glass overflow-hidden rounded-2xl border border-white/5 opacity-80 transition-opacity hover:opacity-100">
                <div className="relative aspect-video grayscale-[0.3]">
                  <img src={c.cover} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {!c.isComingSoon ? (
                      <div className="rounded-full bg-black/60 p-3 text-gold backdrop-blur-md">
                        <Lock className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-gold/90 px-4 py-1 text-xs font-black uppercase tracking-widest text-black shadow-xl shadow-gold/20">
                        Em breve
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-tight">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  
                  {!c.isComingSoon ? (
                    <>
                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investimento</span>
                          <div className="font-display text-2xl font-bold text-gold">
                            R$ {c.price?.toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {c.totalLessons} aulas
                        </div>
                      </div>
                      <button className="btn-fire mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg shadow-fire/10">
                        <ShoppingCart className="h-4 w-4" /> Comprar e Liberar
                      </button>
                    </>
                  ) : (
                    <div className="mt-6 rounded-xl bg-white/5 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Lançamento futuro
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

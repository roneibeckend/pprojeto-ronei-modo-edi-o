import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { courses } from "@/lib/platform-data";

export const Route = createFileRoute("/app/cursos/")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const owned = courses.filter((c) => !c.locked);
  const others = courses.filter((c) => c.locked);

  return (
    <div>
      <PageHeader
        title="Meus cursos"
        subtitle="Continue sua jornada ou descubra novos treinamentos."
        action={
          <Link to="/app/cursos/preview" className="btn-ghost-fire text-sm">
            <Sparkles className="h-4 w-4" /> Ver previews interativas
          </Link>
        }
      />

      <section className="mb-10">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Cursos Liberados
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {owned.map((c) => (
            <article key={c.id} className="glass card-tilt overflow-hidden rounded-2xl">
              <div className="relative aspect-video">
                <img src={c.cover} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                {c.badge && (
                  <div className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                    <Sparkles className="mr-1 inline h-3 w-3" /> {c.badge}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
                  {c.totalLessons} aulas
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-fire" style={{ width: `${c.progress}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{c.progress}% concluído</div>
                <Link
                  to="/app/cursos/$courseId"
                  params={{ courseId: c.id }}
                  className="btn-fire mt-4 inline-flex w-full text-sm"
                >
                  <Play className="h-4 w-4" /> Acessar conteúdo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Disponíveis para compra
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {others.map((c) => (
              <article key={c.id} className="glass overflow-hidden rounded-2xl">
                <div className="relative aspect-video">
                  <img
                    src={c.cover}
                    alt={c.title}
                    className={`h-full w-full object-cover ${c.isComingSoon ? "blur-[2px] brightness-50" : "grayscale-[0.5] brightness-75"}`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    {!c.isComingSoon ? (
                      <div className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-black/60 backdrop-blur">
                        <Lock className="h-6 w-6 text-gold" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-gold/90 px-4 py-1 text-xs font-black uppercase tracking-widest text-black">
                        Em breve
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  
                  {!c.isComingSoon ? (
                    <>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Investimento</div>
                          <div className="font-display text-2xl font-bold text-gold">
                            R$ {c.price?.toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {c.totalLessons} aulas
                        </div>
                      </div>
                      <button className="btn-fire mt-4 inline-flex w-full text-sm">
                        <ShoppingCart className="h-4 w-4" /> Comprar e liberar
                      </button>
                    </>
                  ) : (
                    <button disabled className="mt-6 w-full rounded-xl border border-white/5 bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-not-allowed">
                      Lançamento futuro
                    </button>
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

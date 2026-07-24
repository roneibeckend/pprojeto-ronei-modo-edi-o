import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { courses } from "@/lib/platform-data";

export const Route = createFileRoute("/app/cursos")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const owned = courses.filter((c) => !c.locked);
  const locked = courses.filter((c) => c.locked);

  return (
    <div>
      <PageHeader title="Meus cursos" subtitle="Continue de onde parou ou desbloqueie novos módulos." />

      <section className="mb-10">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Liberados para você
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
                  {c.modules.length} módulos · {c.totalLessons} aulas
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
                  <Play className="h-4 w-4" /> Acessar curso
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {locked.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Desbloqueie mais cursos
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {locked.map((c) => (
              <article key={c.id} className="glass overflow-hidden rounded-2xl">
                <div className="relative aspect-video">
                  <img
                    src={c.cover}
                    alt={c.title}
                    className="h-full w-full object-cover blur-[2px] brightness-50"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-black/60 backdrop-blur">
                      <Lock className="h-6 w-6 text-gold" />
                    </div>
                  </div>
                  <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                    Bloqueado
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">A partir de</div>
                      <div className="font-display text-2xl font-bold text-gold">
                        R$ {c.price?.toFixed(2).replace(".", ",")}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {c.modules.length} módulos<br />
                      {c.totalLessons} aulas
                    </div>
                  </div>
                  <button className="btn-fire mt-4 inline-flex w-full text-sm">
                    <ShoppingCart className="h-4 w-4" /> Comprar e desbloquear
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

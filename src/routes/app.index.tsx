import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, BookOpen, TrendingUp, Award, ArrowRight, Flame } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { student, courses, IMG } from "@/lib/platform-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Início — Espetinho na Veia" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const last = courses.find((c) => c.id === student.lastLesson.courseId)!;
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Olá, ${student.name.split(" ")[0]}! Pronto para continuar aprendendo?`}
        subtitle="Sua jornada rumo aos 10k por mês vendendo espetinhos."
      />

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <img src={IMG.hero} alt="Espetinhos na brasa" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="relative grid gap-6 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-widest">
              <Flame className="h-3.5 w-3.5" /> Sua meta esta semana
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
              Seu negócio pode começar com uma churrasqueira, bons espetinhos e o <span className="text-gradient-fire">conhecimento certo</span>.
            </h2>
            <Link to="/app/cursos/$courseId" params={{ courseId: last.id }} className="btn-fire mt-6 inline-flex">
              <Play className="h-4 w-4" /> Continuar assistindo
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Progresso geral" value={`${student.totalProgress}%`} accent />
        <StatCard icon={Play} label="Aulas assistidas" value={String(student.lessonsWatched)} />
        <StatCard icon={BookOpen} label="Materiais disponíveis" value={String(student.materials)} />
        <StatCard icon={Award} label="Sequência" value={`${student.streak} dias`} />
      </div>

      {/* Continue where you left off */}
      <section>
        <h3 className="mb-4 font-display text-xl font-bold">Continue de onde parou</h3>
        <div className="glass overflow-hidden rounded-2xl">
          <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
            <div className="relative aspect-video sm:aspect-auto">
              <img src={last.cover} alt={last.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 grid place-items-center bg-black/40">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-fire shadow-fire">
                  <Play className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{last.title}</div>
              <div className="mt-1 font-display text-lg font-bold">{student.lastLesson.lessonTitle}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-fire" style={{ width: `${student.lastLesson.percent}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{student.lastLesson.percent}% concluído</div>
              <Link to="/app/cursos/$courseId" params={{ courseId: last.id }} className="btn-fire mt-4 inline-flex">
                Retomar aula <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Next recommended */}
      <section>
        <h3 className="mb-4 font-display text-xl font-bold">Próximo passo recomendado</h3>
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fire shadow-fire">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold">Complete o Módulo 2 — Escolha e preparação das carnes</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Faltam 2 aulas para você desbloquear o módulo de Montagem e Produção.
              </p>
              <Link to="/app/cursos/$courseId" params={{ courseId: "espetinho-lucrativo" }} className="btn-ghost-fire mt-4 inline-flex text-sm">
                Ir para o módulo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${accent ? "gradient-border" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire/20 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

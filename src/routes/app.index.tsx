import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, BookOpen, TrendingUp, Award, ArrowRight, Flame, Loader2 } from "lucide-react";
import { CoverImage } from "@/components/platform/CoverImage";
import { PageHeader } from "@/components/platform/Shell";
import { useProfile, useCourses } from "@/hooks/use-queries";
import { IMG } from "@/lib/platform-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Início — Espetinho na Veia" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: courses, isLoading: loadingCourses } = useCourses();

  if (loadingProfile || loadingCourses) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.name ? profile.name.split(" ")[0] : "Aluno";
  const featuredCourse = courses?.[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Olá, ${firstName}! Pronto para continuar aprendendo?`}
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
            {featuredCourse && (
              <Link to="/app/cursos/$courseId" params={{ courseId: featuredCourse.id }} className="btn-fire mt-6 inline-flex">
                <Play className="h-4 w-4" /> Começar curso agora
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Progresso geral" value="0%" accent />
        <StatCard icon={Play} label="Aulas assistidas" value="0" />
        <StatCard icon={BookOpen} label="Materiais disponíveis" value="8" />
        <StatCard icon={Award} label="Sequência" value="0 dias" />
      </div>

      {/* Recommended */}
      <section>
        <h3 className="mb-4 font-display text-xl font-bold">Cursos recomendados</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course: any) => (
            <div key={course.id} className="glass overflow-hidden rounded-2xl group border border-white/5 hover:border-primary/30 transition-colors">
              <div className="relative aspect-video">
                <CoverImage src={course.cover_url} alt={course.title} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                   <div className="h-10 w-10 rounded-full bg-fire grid place-items-center shadow-fire">
                     <Play className="h-4 w-4 text-white" />
                   </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-sm line-clamp-1">{course.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                <Link to="/app/cursos/$courseId" params={{ courseId: course.id }} className="mt-4 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  Ver curso <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
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

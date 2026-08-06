import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, BookOpen, TrendingUp, Award, ArrowRight, Flame, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { student, courses, IMG, Course } from "@/lib/platform-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Início — Espetinho na Veia" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const last = courses.find((c) => c.id === student.lastLesson.courseId) || courses[0];
  const owned = courses.filter((c) => !c.locked);
  const others = courses.filter((c) => c.locked);

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

      {/* Showcase / Vitrine */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight">Vitrine de Cursos</h2>
          <Link to="/app/cursos" className="text-sm font-medium text-gold hover:underline">Ver todos</Link>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseShowcaseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Progresso geral" value={`${student.totalProgress}%`} accent />
        <StatCard icon={Play} label="Aulas assistidas" value={String(student.lessonsWatched)} />
        <StatCard icon={BookOpen} label="Materiais disponíveis" value={String(student.materials)} />
        <StatCard icon={Award} label="Sequência" value={`${student.streak} dias`} />
      </div>
    </div>
  );
}

function CourseShowcaseCard({ course }: { course: Course }) {
  const isLocked = course.locked;
  
  return (
    <article className={`glass overflow-hidden rounded-2xl transition-all duration-300 ${isLocked ? "opacity-90 grayscale-[0.3]" : "card-tilt shadow-lg"}`}>
      <div className="relative aspect-video">
        <img 
          src={course.cover} 
          alt={course.title} 
          className={`h-full w-full object-cover ${isLocked ? "blur-[1px] brightness-75" : ""}`} 
          loading="lazy" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {course.badge && !isLocked && (
          <div className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
            <Sparkles className="mr-1 inline h-3 w-3" /> {course.badge}
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
            {!course.isComingSoon && (
              <div className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-black/60 border border-white/20">
                <Lock className="h-5 w-5 text-gold" />
              </div>
            )}
            {course.isComingSoon && (
              <div className="rounded-full bg-gold/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                Em breve
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
           <div className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
            {course.totalLessons > 0 ? `${course.totalLessons} aulas` : "Em breve"}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold line-clamp-1">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground min-h-[40px]">{course.description}</p>
        
        {isLocked ? (
          <div className="mt-4">
            {!course.isComingSoon ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Acesso imediato</span>
                  <div className="font-display text-xl font-bold text-gold">R$ {course.price?.toFixed(2).replace(".", ",")}</div>
                </div>
                <button className="btn-fire px-4 py-2 text-xs">
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Comprar
                </button>
              </div>
            ) : (
              <button disabled className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-not-allowed">
                Aguarde o lançamento
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[10px] font-medium">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-gold">{course.progress}%</span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold" style={{ width: `${course.progress}%` }} />
            </div>
            <Link
              to="/app/cursos/$courseId"
              params={{ courseId: course.id }}
              className="btn-fire flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest"
            >
              <Play className="h-3.5 w-3.5" /> Continuar Aluno
            </Link>
          </div>
        )}
      </div>
    </article>
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

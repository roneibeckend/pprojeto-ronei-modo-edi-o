import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { courses } from "@/lib/platform-data";

export const Route = createFileRoute("/app/cursos")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <div>
      <PageHeader title="Meus cursos" subtitle="Continue de onde parou ou explore novos módulos." />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <article key={c.id} className="glass card-tilt overflow-hidden rounded-2xl">
            <div className="relative aspect-video">
              <img src={c.cover} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
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
              <Link to="/app/cursos/$courseId" params={{ courseId: c.id }} className="btn-fire mt-4 inline-flex w-full text-sm">
                <Play className="h-4 w-4" /> Acessar curso
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

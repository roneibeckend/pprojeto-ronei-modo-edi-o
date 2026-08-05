import { createFileRoute } from "@tanstack/react-router";
import { Award, Flame, Trophy, Lock } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
const student = { totalProgress: 0, streak: 0, lessonsWatched: 0 };
const achievements: any[] = [];
const courses: any[] = [];
const ebooks: any[] = [];
const certificates: any[] = [];

export const Route = createFileRoute("/app/progresso")({
  head: () => ({ meta: [{ title: "Meu progresso — Espetinho na Veia" }] }),
  component: ProgressPage,
});

const weeks = [30, 50, 45, 70, 65, 80, 92, 78, 88, 95, 82, 100];

function ProgressPage() {
  const started = courses.filter((c) => c.progress > 0).length;
  const finished = courses.filter((c) => c.progress === 100).length;
  const read = ebooks.filter((e) => e.progress === 100).length;
  const unlocked = certificates.filter((c) => c.unlocked).length;

  return (
    <div>
      <PageHeader title="Meu progresso" subtitle="Acompanhe sua evolução na jornada." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Progresso total" value={`${student.totalProgress}%`} />
        <Stat label="Cursos iniciados" value={String(started)} />
        <Stat label="Cursos finalizados" value={String(finished)} />
        <Stat label="Sequência" value={`${student.streak} dias`} icon={Flame} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold">Evolução dos últimos meses</h3>
          <div className="mt-6 flex h-56 items-end gap-2">
            {weeks.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-fire transition-all"
                  style={{ height: `${v}%`, opacity: 0.4 + (v / 100) * 0.6 }}
                />
                <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div><div className="text-muted-foreground text-xs">E-books lidos</div><div className="font-bold">{read}</div></div>
            <div><div className="text-muted-foreground text-xs">Aulas assistidas</div><div className="font-bold">{student.lessonsWatched}</div></div>
            <div><div className="text-muted-foreground text-xs">Certificados</div><div className="font-bold">{unlocked}</div></div>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold">Conquistas</h3>
          <ul className="mt-4 space-y-3">
            {achievements.map((a) => (
              <li key={a.id} className={`flex items-center gap-3 rounded-xl border p-3 ${a.unlocked ? "border-primary/40 bg-fire/10" : "border-white/5 opacity-60"}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-full ${a.unlocked ? "bg-fire text-white" : "bg-white/5 text-muted-foreground"}`}>
                  {a.unlocked ? <Trophy className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">{a.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon = Award }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="glass rounded-2xl p-5">
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

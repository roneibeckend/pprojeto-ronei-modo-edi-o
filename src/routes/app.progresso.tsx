import { createFileRoute } from "@tanstack/react-router";
import { Award, Flame, Trophy, Lock, BookOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/progresso")({
  head: () => ({ meta: [{ title: "Meu progresso — Espetinho na Veia" }] }),
  component: ProgressPage,
});

const weeks = [30, 50, 45, 70, 65, 80, 92, 78, 88, 95, 82, 100];

function ProgressPage() {
  const { user } = useAuth();

  const { data: courseProgress, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["course-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_progress").select("*").eq("user_id", user?.id || "");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: ebookProgress, isLoading: isLoadingEbooks } = useQuery({
    queryKey: ["ebook-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebook_progress").select("*").eq("user_id", user?.id || "");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoadingCourses || isLoadingEbooks) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  const finishedCourses = 0; // Mock real logic if needed
  const readChapters = ebookProgress?.length || 0;

  return (
    <div>
      <PageHeader title="Meu progresso" subtitle="Acompanhe sua evolução na jornada." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Aulas assistidas" value={String(courseProgress?.length || 0)} />
        <Stat label="Capítulos lidos" value={String(readChapters)} icon={BookOpen} />
        <Stat label="Sequência" value="0 dias" icon={Flame} />
        <Stat label="Certificados" value="0" />
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
        </section>

        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold">Resumo da Atividade</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <span className="text-sm font-medium">Aulas Concluídas</span>
              <span className="text-xl font-bold text-fire">{courseProgress?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <span className="text-sm font-medium">Capítulos de E-books</span>
              <span className="text-xl font-bold text-gold">{readChapters}</span>
            </div>
          </div>
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

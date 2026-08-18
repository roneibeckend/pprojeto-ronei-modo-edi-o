import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/platform/Shell";
import { Trophy, Medal, Star, Target, TrendingUp, Loader2, Calendar, Award, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getRankingSettings } from "@/lib/ranking.functions";
import { getCampaigns } from "@/lib/campaigns.functions";
import { useServerFn } from "@tanstack/react-start";
import { format, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/progresso")({
  head: () => ({ meta: [{ title: "Ranking de Alunos — Ronnei na Veia" }] }),
  component: RankingPage,
});

type RankingRow = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  total_points: number;
  global_rank: number;
};

function RankingPage() {
  const fetchSettings = useServerFn(getRankingSettings);

  const { data: rankingSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["ranking-settings"],
    queryFn: () => fetchSettings()
  });

  const { data: ranking, isLoading: isLoadingRanking } = useQuery({
    queryKey: ["student-ranking", rankingSettings],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_student_ranking_v2", { 
        p_limit: 50,
        p_start_date: rankingSettings?.isGlobal ? null : rankingSettings?.startDate,
        p_end_date: rankingSettings?.isGlobal ? null : rankingSettings?.endDate
      });
      if (error) throw error;
      return (data ?? []) as RankingRow[];
    },
    enabled: !isLoadingSettings
  });

  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoadingRanking || isLoadingStats || isLoadingSettings) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const top3 = ranking?.slice(0, 3) || [];
  const others = ranking?.slice(3) || [];
  
  const periodText = rankingSettings?.isGlobal 
    ? "Ranking Global" 
    : `Ranking do Período (${rankingSettings?.startDate ? format(new Date(rankingSettings.startDate), "dd/MM/yy") : '?'} até ${rankingSettings?.endDate ? format(new Date(rankingSettings.endDate), "dd/MM/yy") : '?'})`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Ranking de Alunos" 
          subtitle="Conclua módulos e cursos rapidamente para subir no ranking e ganhar pontos!" 
        />
        {!rankingSettings?.isGlobal && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest animate-pulse">
            <Calendar className="h-3 w-3" />
            {periodText}
          </div>
        )}
      </div>

      {/* User Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass flex items-center gap-4 rounded-2xl p-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Seus Pontos</div>
            <div className="text-2xl font-black">{userStats?.total_points || 0}</div>
          </div>
        </div>
        <div className="glass flex items-center gap-4 rounded-2xl p-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Nível</div>
            <div className="text-2xl font-black">{userStats?.level || 1}</div>
          </div>
        </div>
        <div className="glass flex items-center gap-4 rounded-2xl p-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Sua Posição</div>
            <div className="text-2xl font-black">
              {ranking?.find(r => r.user_id === userStats?.user_id)?.global_rank || "—"}º
            </div>
          </div>
        </div>
      </div>

      {/* Podium */}
      <div className="flex flex-col items-end justify-center gap-4 pt-12 sm:flex-row sm:items-end sm:gap-0 sm:pt-20">
        {/* 2nd Place */}
        {top3[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 flex w-full flex-col items-center sm:order-1 sm:w-1/3"
          >
            <div className="relative mb-4">
              <img src={top3[1].avatar_url || "/placeholder.svg"} className="h-20 w-20 rounded-full border-4 border-slate-400 object-cover" alt="" />
              <div className="absolute -bottom-2 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-slate-400 font-bold text-slate-900">2</div>
            </div>
            <div className="text-center">
              <div className="font-bold whitespace-normal break-words">{top3[1].name}</div>
              <div className="text-sm text-slate-400">{top3[1].total_points} pts</div>
            </div>
            <div className="mt-4 hidden h-24 w-full rounded-t-2xl bg-slate-400/10 sm:block" />
          </motion.div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="order-1 flex w-full flex-col items-center z-10 sm:order-2 sm:w-1/3"
          >
            <Trophy className="mb-2 h-8 w-8 text-yellow-500 animate-bounce" />
            <div className="relative mb-4">
              <img src={top3[0].avatar_url || "/placeholder.svg"} className="h-28 w-28 rounded-full border-4 border-yellow-500 object-cover" alt="" />
              <div className="absolute -bottom-2 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-yellow-500 font-bold text-yellow-950">1</div>
            </div>
            <div className="text-center">
              <div className="font-black text-lg whitespace-normal break-words">{top3[0].name}</div>
              <div className="text-sm text-yellow-500 font-bold">{top3[0].total_points} pts</div>
            </div>
            <div className="mt-4 hidden h-32 w-full rounded-t-2xl bg-yellow-500/10 sm:block" />
          </motion.div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3 flex w-full flex-col items-center sm:w-1/3"
          >
            <div className="relative mb-4">
              <img src={top3[2].avatar_url || "/placeholder.svg"} className="h-16 w-16 rounded-full border-4 border-amber-700 object-cover" alt="" />
              <div className="absolute -bottom-2 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full bg-amber-700 font-bold text-amber-100">3</div>
            </div>
            <div className="text-center">
              <div className="font-bold whitespace-normal break-words">{top3[2].name}</div>
              <div className="text-sm text-amber-700">{top3[2].total_points} pts</div>
            </div>
            <div className="mt-4 hidden h-16 w-full rounded-t-2xl bg-amber-700/10 sm:block" />
          </motion.div>
        )}
      </div>

      {/* List */}
      <div className="glass overflow-hidden rounded-2xl border border-white/5">
        <div className="divide-y divide-white/5">
          {others.map((student, idx) => (
            <div key={student.user_id} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.02]">
              <div className="w-8 text-center font-bold text-muted-foreground">{student.global_rank}</div>
              <img src={student.avatar_url || "/placeholder.svg"} className="h-10 w-10 rounded-full object-cover" alt="" />
              <div className="flex-1 font-medium break-words">{student.name}</div>
              <div className="text-right">
                <div className="font-bold text-primary">{student.total_points}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">pontos</div>
              </div>
            </div>
          ))}

          {others.length === 0 && top3.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              Ainda não há pontuações registradas. Comece a estudar para inaugurar o ranking!
            </div>
          )}
        </div>
      </div>

      {/* Rules Info */}
      <div className="rounded-2xl bg-blue-500/5 p-6 border border-blue-500/10">
        <h3 className="font-bold text-blue-500 mb-2 flex items-center gap-2">
          <Medal className="h-4 w-4" /> Como ganhar pontos?
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>Conclusão de Módulo: <span className="text-foreground font-bold">10 pontos</span> base.</li>
          <li>Conclusão de Curso: <span className="text-foreground font-bold">50 pontos</span> base.</li>
          <li>Bônus de Rapidez: <span className="text-foreground font-bold">+50%</span> se concluir em 24h, <span className="text-foreground font-bold">+25%</span> se concluir em 48h.</li>
        </ul>
      </div>
    </div>
  );
}

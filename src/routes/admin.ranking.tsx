import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Trophy, 
  Calendar, 
  Save, 
  Loader2, 
  Globe, 
  Clock,
  LayoutDashboard,
  Filter,
  CheckCircle2
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { getRankingSettings, updateRankingSettings } from "@/lib/ranking.functions";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/ranking")({
  head: () => ({ meta: [{ title: "Configuração de Ranking · Admin" }] }),
  component: AdminRankingConfig,
});

const ORANGE = "#ff6a00";

function AdminRankingConfig() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getRankingSettings);
  const saveSettings = useServerFn(updateRankingSettings);

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["admin-ranking-settings"],
    queryFn: () => fetchSettings({})
  });

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isGlobal, setIsGlobal] = useState<boolean>(true);

  useEffect(() => {
    if (settings) {
      setStartDate(settings.startDate?.split('T')[0] || "");
      setEndDate(settings.endDate?.split('T')[0] || "");
      setIsGlobal(settings.isGlobal ?? true);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      return saveSettings({
        data: {
          startDate: startDate ? `${startDate}T00:00:00Z` : null,
          endDate: endDate ? `${endDate}T23:59:59Z` : null,
          isGlobal
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ranking-settings"] });
      toast.success("Configurações de ranking atualizadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Gerenciamento de Ranking</h2>
          <p className="text-sm text-white/40 text-left">Configure o período do ranking e gerencie as campanhas de premiação.</p>
        </div>
        <Link 
          to="/admin/ranking/campanhas"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          <Trophy className="h-4 w-4 text-[#ff6a00]" /> Campanhas e Premiações
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <section className="border border-white/5 bg-[#111] p-6 rounded-xl">
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <Filter className="h-4 w-4" style={{ color: ORANGE }} /> Modo de Exibição
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setIsGlobal(true)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isGlobal 
                    ? "bg-[#ff6a00]/10 border-[#ff6a00] text-[#ff6a00]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-sm font-bold">Ranking Histórico (Global)</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60">Todos os tempos</div>
                  </div>
                </div>
                {isGlobal && <CheckCircle2 className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setIsGlobal(false)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  !isGlobal 
                    ? "bg-[#ff6a00]/10 border-[#ff6a00] text-[#ff6a00]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-sm font-bold">Ranking por Período</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60">Campeões do mês / temporada</div>
                  </div>
                </div>
                {!isGlobal && <CheckCircle2 className="h-5 w-5" />}
              </button>
            </div>
          </section>

          {!isGlobal && (
            <section className="border border-white/5 bg-[#111] p-6 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                <Clock className="h-4 w-4" style={{ color: ORANGE }} /> Intervalo de Datas
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Data de Início</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Data de Fim</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-[#ff6a00]/5 border border-[#ff6a00]/10 flex items-start gap-3">
                <Trophy className="h-5 w-5 text-[#ff6a00] shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/60 leading-relaxed italic">
                  Apenas os pontos conquistados entre {startDate ? format(new Date(startDate + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) : '...'} e {endDate ? format(new Date(endDate + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) : '...'} serão contabilizados.
                </p>
              </div>
            </section>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#ff6a00] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </button>
        </div>

        <div className="space-y-6">
          <section className="border border-white/5 bg-[#111] p-6 rounded-xl h-full">
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <LayoutDashboard className="h-4 w-4" style={{ color: ORANGE }} /> Resumo do Impacto
            </div>
            
            <div className="space-y-6 text-sm text-white/60 leading-relaxed">
              <div className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">O que muda para o aluno?</h4>
                <p>O ranking exibido na rota <code>/app/progresso</code> será filtrado automaticamente. Alunos que não estudaram no período escolhido podem não aparecer no ranking.</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">Cálculo de Pontos</h4>
                <p>O sistema recalcula em tempo real com base no <code>completed_at</code> da tabela de rastreamento de progresso.</p>
              </div>

              <div className="mt-auto pt-10 flex justify-center">
                <div className="relative">
                  <Trophy className="h-20 w-20 text-[#ff6a00]/20" />
                  <Trophy className="h-16 w-16 text-[#ff6a00] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

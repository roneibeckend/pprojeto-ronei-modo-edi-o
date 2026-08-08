import { createFileRoute } from "@tanstack/react-router";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  DollarSign, 
  PieChart, 
  LayoutTemplate,
  Info,
  Save,
  Loader2,
  TrendingUp
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { distributeProfits } from "@/lib/payouts.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Painel Admin" }] }),
  component: FinancePage,
});

const ORANGE = "#ff6a00";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Cost = { id: string; label: string; value: number };
type Partner = { id: string; name: string; percent: number; user_id?: string | null };

function FinancePage() {
  const queryClient = useQueryClient();
  const [revenue, setRevenue] = useState<number>(0);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Fetch initial data
  const { isLoading } = useQuery({
    queryKey: ["financial-config"],
    queryFn: async () => {
      const [settingsRes, costsRes, partnersRes] = await Promise.all([
        supabase.from("financial_settings").select("*").single(),
        supabase.from("financial_costs").select("*").order("created_at"),
        supabase.from("financial_partners").select("*").order("created_at")
      ]);

      if (settingsRes.data) setRevenue(Number(settingsRes.data.manual_revenue));
      if (costsRes.data) setCosts(costsRes.data.map(c => ({ id: c.id, label: c.label, value: Number(c.value) })));
      if (partnersRes.data) setPartners(partnersRes.data.map(p => ({ 
        id: p.id, 
        name: p.name, 
        percent: Number(p.percent),
        user_id: p.user_id
      })));

      return {
        revenue: settingsRes.data,
        costs: costsRes.data,
        partners: partnersRes.data
      };
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Save revenue
      const { error: settingsError } = await supabase
        .from("financial_settings")
        .upsert({ 
          id: '00000000-0000-0000-0000-000000000000', 
          manual_revenue: revenue,
          updated_at: new Date().toISOString()
        });
      if (settingsError) throw settingsError;

      // 2. Save costs (Replace all)
      await supabase.from("financial_costs").delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      const { error: costsError } = await supabase
        .from("financial_costs")
        .insert(costs.map(c => ({ label: c.label, value: c.value })));
      if (costsError) throw costsError;

      // 3. Save partners (Replace all)
      await supabase.from("financial_partners").delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      const { error: partnersError } = await supabase
        .from("financial_partners")
        .insert(partners.map(p => ({ name: p.name, percent: p.percent, user_id: p.user_id })));
      if (partnersError) throw partnersError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-config"] });
      toast.success("Configurações financeiras salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  const totalCost = useMemo(() => costs.reduce((s, c) => s + (c.value || 0), 0), [costs]);
  const profit = revenue - totalCost;
  const totalPercent = useMemo(() => partners.reduce((s, p) => s + (p.percent || 0), 0), [partners]);
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const updateCost = (id: string, patch: Partial<Cost>) =>
    setCosts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCost = (id: string) => setCosts((cs) => cs.filter((c) => c.id !== id));
  const addCost = () =>
    setCosts((cs) => [...cs, { id: `c${Date.now()}`, label: "Novo custo", value: 0 }]);

  const updatePartner = (id: string, patch: Partial<Partner>) =>
    setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePartner = (id: string) => setPartners((ps) => ps.filter((p) => p.id !== id));
  const addPartner = () =>
    setPartners((ps) => [...ps, { id: `p${Date.now()}`, name: "Novo sócio", percent: 0, user_id: null }]);

  const { data: users } = useQuery({
    queryKey: ["users-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name, email").order("name");
      if (error) throw error;
      return data;
    }
  });

  const distributeProfitsFn = useServerFn(distributeProfits);

  const handleDistribute = async () => {
    try {
      if (profit <= 0) {
        toast.error("Não há lucro disponível para distribuição.");
        return;
      }

      if (totalPercent !== 100) {
        toast.error("A soma das porcentagens dos sócios deve ser 100%.");
        return;
      }

      toast.loading("Distribuindo lucros...", { id: "distribute-loading" });

      for (const partner of partners) {
        if (partner.percent > 0) {
          const amount = (profit * partner.percent) / 100;
          
          if (partner.user_id) {
            await distributeProfitsFn({ data: { amount, partnerId: partner.user_id } });
          } else {
            console.warn(`Sócio ${partner.name} não possui usuário vinculado. Pulando distribuição.`);
          }
        }
      }

      toast.success("Distribuição de lucros processada!", { id: "distribute-loading" });
    } catch (error: any) {
      toast.error("Erro na distribuição: " + error.message, { id: "distribute-loading" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-sm text-black shrink-0" style={{ backgroundColor: ORANGE }}>
            <DollarSign className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white text-left">
              Painel Financeiro
            </h2>
            <p className="text-[10px] sm:text-xs text-white/40 text-left">Custos, lucro e divisão de sócios</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDistribute}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
          >
            <TrendingUp className="h-4 w-4" />
            Distribuir Lucros
          </button>
          
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resumo */}
        <div className="lg:col-span-3">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
              <div className="border border-white/5 bg-white/[0.02] p-3 sm:p-5">
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Receita Bruta</div>
                <div className="text-lg sm:text-2xl font-display font-extrabold text-white">{brl(revenue)}</div>
              </div>
              <div className="border border-white/5 bg-white/[0.02] p-3 sm:p-5">
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Custos Totais</div>
                <div className="text-lg sm:text-2xl font-display font-extrabold text-red-400">{brl(totalCost)}</div>
              </div>
              <div className="border border-white/5 bg-white/[0.02] p-3 sm:p-5">
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Lucro Líquido</div>
                <div className="text-lg sm:text-2xl font-display font-extrabold text-emerald-400">{brl(profit)}</div>
              </div>
              <div className="border border-white/5 bg-white/[0.02] p-3 sm:p-5">
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Margem Líquida</div>
                <div className={`text-lg sm:text-2xl font-display font-extrabold ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</div>
              </div>
           </div>
        </div>

        {/* Coluna 1: Receita e Profit Table */}
        <div className="space-y-6 text-left">
          <section className="border border-white/5 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <Calculator className="h-4 w-4" style={{ color: ORANGE }} /> Ajustar Receita
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/30 mb-2">Valor da Receita (BRL)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">R$</span>
                  <input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-sm border border-white/10 bg-black pl-11 pr-4 py-3 font-display text-2xl font-extrabold text-emerald-400 outline-none transition focus:border-[color:var(--orange)]"
                    style={{ ["--orange" as any]: ORANGE }}
                  />
                </div>
              </div>

              <div className="rounded-sm bg-white/[0.03] p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Receita Bruta</span>
                  <span className="font-bold text-white">{brl(revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Impostos / Taxas (Est.)</span>
                  <span className="font-bold text-red-400/70">− {brl(revenue * 0.1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Custos Operacionais</span>
                  <span className="font-bold text-red-400">− {brl(totalCost)}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                  <span className="text-xs font-bold uppercase text-white/30">Lucro Disponível</span>
                  <span className="text-xl font-display font-extrabold text-emerald-400">{brl(profit)}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 rounded-sm border border-orange-500/20 bg-orange-500/5 p-4 text-[11px] leading-relaxed text-orange-200/60">
            <Info className="h-4 w-4 shrink-0 text-orange-400" />
            <span>Os valores acima são calculados automaticamente com base na entrada de custos e receitas. Utilize para simulações de escala.</span>
          </div>
        </div>

        {/* Coluna 2: Custos */}
        <section className="border border-white/5 bg-black/40 p-6 flex flex-col text-left">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <LayoutTemplate className="h-4 w-4" style={{ color: ORANGE }} /> Quadro de Custos
            </div>
            <button
              onClick={addCost}
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black transition hover:brightness-110"
              style={{ backgroundColor: ORANGE }}
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {costs.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-2 border border-white/10 bg-black/40 p-2 transition hover:border-[color:var(--orange)]"
                style={{ ["--orange" as any]: ORANGE }}
              >
                <div className="flex-1 min-w-0">
                  <input
                    value={c.label}
                    onChange={(e) => updateCost(c.id, { label: e.target.value })}
                    className="w-full bg-transparent px-2 py-1 text-sm font-medium text-white/80 outline-none focus:text-white"
                    placeholder="Descrição do custo"
                  />
                </div>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20">R$</span>
                  <input
                    type="number"
                    value={c.value}
                    onChange={(e) => updateCost(c.id, { value: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-sm bg-black/60 pl-6 pr-2 py-1 text-right text-sm text-white outline-none focus:bg-black"
                  />
                </div>
                <button
                  onClick={() => removeCost(c.id)}
                  className="p-1 text-white/20 transition hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between border-t border-white/10 pt-4">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Total Operacional</span>
            <span className="font-display text-xl font-extrabold text-red-400">{brl(totalCost)}</span>
          </div>
        </section>

        {/* Coluna 3: Sócios */}
        <section className="border border-white/5 bg-black/40 p-6 flex flex-col text-left">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <PieChart className="h-4 w-4" style={{ color: ORANGE }} /> Divisão de Sócios
            </div>
            <button
              onClick={addPartner}
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black transition hover:brightness-110"
              style={{ backgroundColor: ORANGE }}
            >
              <Plus className="h-3 w-3" /> Sócio
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {partners.map((p) => {
              const share = (profit * (p.percent || 0)) / 100;
              return (
                <div
                  key={p.id}
                  className="group relative border border-white/10 bg-black/40 p-4 transition hover:border-[color:var(--orange)]"
                  style={{ ["--orange" as any]: ORANGE }}
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <input
                      value={p.name}
                      onChange={(e) => updatePartner(p.id, { name: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-bold text-white outline-none"
                      placeholder="Nome do Sócio"
                    />
                    <select
                      value={p.user_id || ""}
                      onChange={(e) => updatePartner(p.id, { user_id: e.target.value || null })}
                      className="max-w-[150px] bg-black border border-white/10 rounded-sm px-2 py-1 text-[10px] text-white outline-none focus:border-orange-500"
                    >
                      <option value="">Vincular Usuário</option>
                      {users?.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <div className="relative w-16">
                         <input
                          type="number"
                          value={p.percent}
                          onChange={(e) => updatePartner(p.id, { percent: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-sm bg-black px-2 py-1 text-right text-xs font-bold text-white outline-none"
                        />
                        <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30">%</span>
                      </div>
                      <button
                        onClick={() => removePartner(p.id)}
                        className="ml-4 p-1 text-white/20 transition hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div className="flex-1 max-w-[120px]">
                      <div className="h-1 w-full bg-white/5">
                        <div
                          className="h-full bg-[color:var(--orange)] transition-all duration-700"
                          style={{ width: `${Math.min(100, p.percent)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Participação</div>
                      <div className={`text-sm font-display font-extrabold ${share >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {brl(share)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Total Distribuído</span>
              <span className={`text-lg font-display font-extrabold ${totalPercent === 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {totalPercent}%
              </span>
            </div>
            {totalPercent !== 100 && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-400/80 animate-pulse">
                <Info className="h-3 w-3" />
                <span>A soma deve ser 100% (Atual: {totalPercent}%)</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
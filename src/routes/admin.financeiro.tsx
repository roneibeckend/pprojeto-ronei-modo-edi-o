import { createFileRoute } from "@tanstack/react-router";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  DollarSign, 
  PieChart, 
  LayoutTemplate,
  Info
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Painel Admin" }] }),
  component: FinancePage,
});

const ORANGE = "#ff6a00";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Cost = { id: string; label: string; value: number };
type Partner = { id: string; name: string; percent: number };

function FinancePage() {
  const [revenue, setRevenue] = useState<number>(137240);
  const [costs, setCosts] = useState<Cost[]>([
    { id: "c1", label: "Plataforma / hospedagem", value: 1200 },
    { id: "c2", label: "Tráfego pago (ads)", value: 28000 },
    { id: "c3", label: "Taxas de gateway", value: 8200 },
    { id: "c4", label: "Produção de conteúdo", value: 6500 },
    { id: "c5", label: "Suporte e equipe", value: 9800 },
  ]);
  const [partners, setPartners] = useState<Partner[]>([
    { id: "p1", name: "Ronnei (Sócio fundador)", percent: 50 },
    { id: "p2", name: "Sócio operacional", percent: 30 },
    { id: "p3", name: "Sócio investidor", percent: 20 },
  ]);

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
    setPartners((ps) => [...ps, { id: `p${Date.now()}`, name: "Novo sócio", percent: 0 }]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-sm text-black" style={{ backgroundColor: ORANGE }}>
          <DollarSign className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white">
            Painel Financeiro
          </h2>
          <p className="text-xs text-white/40">Custos, lucro e divisão de sócios</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resumo */}
        <div className="lg:col-span-3">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-white/5 bg-white/[0.02] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Receita Bruta</div>
                <div className="text-2xl font-display font-extrabold text-white">{brl(revenue)}</div>
              </div>
              <div className="border border-white/5 bg-white/[0.02] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Custos Totais</div>
                <div className="text-2xl font-display font-extrabold text-red-400">{brl(totalCost)}</div>
              </div>
              <div className="border border-white/5 bg-white/[0.02] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Lucro Líquido</div>
                <div className="text-2xl font-display font-extrabold text-emerald-400">{brl(profit)}</div>
              </div>
              <div className="border border-white/5 bg-white/[0.02] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Margem Líquida</div>
                <div className={`text-2xl font-display font-extrabold ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</div>
              </div>
           </div>
        </div>

        {/* Coluna 1: Receita e Profit Table */}
        <div className="space-y-6">
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
        <section className="border border-white/5 bg-black/40 p-6 flex flex-col">
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
        <section className="border border-white/5 bg-black/40 p-6 flex flex-col">
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

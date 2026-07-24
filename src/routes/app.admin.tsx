import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, GraduationCap, BookOpen, Play, TrendingUp, Activity, Plus, Settings, Video, ChefHat, FileSpreadsheet, Award, Calculator, Trash2, DollarSign, PieChart, Sparkles, Wand2, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/platform/Shell";
import { adminStats } from "@/lib/platform-data";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — Espetinho na Veia" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Painel administrativo"
        subtitle="Visão geral e gerenciamento da plataforma."
        action={<button className="btn-fire text-sm"><Settings className="h-4 w-4" /> Configurações</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat icon={Users} label="Alunos" value={adminStats.students.toLocaleString("pt-BR")} />
        <AdminStat icon={GraduationCap} label="Cursos ativos" value={String(adminStats.activeCourses)} />
        <AdminStat icon={BookOpen} label="E-books cadastrados" value={String(adminStats.ebooks)} />
        <AdminStat icon={Play} label="Aulas assistidas" value={adminStats.lessonsWatched.toLocaleString("pt-BR")} />
        <AdminStat icon={TrendingUp} label="Conclusão média" value={`${adminStats.avgCompletion}%`} accent />
        <AdminStat icon={Activity} label="Ativos recentemente" value={String(adminStats.activeRecent)} />
        <AdminStat icon={Award} label="Certificados emitidos" value="1.284" />
        <AdminStat icon={TrendingUp} label="Faturamento" value={adminStats.revenue} accent />
      </div>

      <section className="glass mt-8 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Alunos ativos nos últimos meses</h3>
          <div className="text-xs text-muted-foreground">últimos 12 meses</div>
        </div>
        <div className="mt-6 flex h-48 items-end gap-2">
          {adminStats.chart.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-fire" style={{ height: `${v * 1.5}%`, opacity: 0.5 + v / 200 }} />
              <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminAction icon={GraduationCap} title="Cadastrar curso" desc="Crie um novo curso e organize módulos." />
        <AdminAction icon={Video} title="Upload de vídeos" desc="Envie aulas em MP4 direto para as trilhas." />
        <AdminAction icon={BookOpen} title="Cadastrar e-book" desc="Publique um novo material na biblioteca." />
        <AdminAction icon={ChefHat} title="Cadastrar receita" desc="Adicione receitas com custo e lucro." />
        <AdminAction icon={FileSpreadsheet} title="Novo material" desc="Planilhas, PDFs e artes de divulgação." />
        <AdminAction icon={Users} title="Gerenciar alunos" desc="Consulte, edite e libere acessos." />
      </section>

      <FinancePanel />

      <section className="glass mt-8 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Últimos alunos cadastrados</h3>
          <button className="btn-ghost-fire text-xs">Ver todos</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-3">Aluno</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">Curso principal</th>
                <th className="pb-3">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["André Silva", "andre@exemplo.com", "Espetinho Lucrativo", "42%"],
                ["Mariana Costa", "mari@exemplo.com", "Molhos e Acompanhamentos", "78%"],
                ["Carlos Mendes", "carlos@exemplo.com", "Como Vender Mais", "15%"],
                ["Fernanda Rocha", "fe@exemplo.com", "Gestão do Negócio", "60%"],
                ["Tiago Almeida", "tiago@exemplo.com", "Espetinho Lucrativo", "92%"],
              ].map((r) => (
                <tr key={r[1]} className="border-t border-white/5">
                  <td className="py-3 font-medium">{r[0]}</td>
                  <td className="py-3 text-muted-foreground">{r[1]}</td>
                  <td className="py-3">{r[2]}</td>
                  <td className="py-3"><span className="rounded-full bg-fire/20 px-2 py-0.5 text-xs text-primary">{r[3]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${accent ? "gradient-border" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire/20 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function AdminAction({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <button className="glass card-tilt group rounded-2xl p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fire text-white shadow-fire">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-bold">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
        <Plus className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
      </div>
    </button>
  );
}

type Cost = { id: string; label: string; value: number };
type Partner = { id: string; name: string; percent: number };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinancePanel() {
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
    <section className="glass mt-8 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire text-white shadow-fire">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Financeiro — Custos, lucro e divisão de sócios</h3>
            <p className="text-xs text-muted-foreground">Calcule em tempo real o resultado da empresa e a distribuição do lucro.</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Margem líquida: <span className={`font-bold ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>{margin.toFixed(1)}%</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Receita */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Receita bruta do período
          </div>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-display text-2xl font-bold text-emerald-400 outline-none focus:border-primary"
          />
          <div className="mt-2 text-xs text-muted-foreground">{brl(revenue)}</div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Receita</span><span className="font-semibold text-emerald-400">{brl(revenue)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Custos totais</span><span className="font-semibold text-red-400">− {brl(totalCost)}</span></div>
            <div className="my-2 border-t border-white/10" />
            <div className="flex justify-between"><span className="font-semibold">Lucro líquido</span><span className={`font-display text-xl font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{brl(profit)}</span></div>
          </div>
        </div>

        {/* Custos */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" /> Custos da empresa
            </div>
            <button onClick={addCost} className="btn-ghost-fire text-xs"><Plus className="h-3 w-3" /> Adicionar</button>
          </div>
          <div className="space-y-2">
            {costs.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <input
                  value={c.label}
                  onChange={(e) => updateCost(c.id, { label: e.target.value })}
                  className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                />
                <input
                  type="number"
                  value={c.value}
                  onChange={(e) => updateCost(c.id, { value: parseFloat(e.target.value) || 0 })}
                  className="w-28 rounded-lg bg-black/40 px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={() => removeCost(c.id)} className="text-muted-foreground hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-muted-foreground">Total de custos</span>
            <span className="font-display text-lg font-bold text-red-400">{brl(totalCost)}</span>
          </div>
        </div>

        {/* Sócios */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <PieChart className="h-4 w-4" /> Divisão do lucro
            </div>
            <button onClick={addPartner} className="btn-ghost-fire text-xs"><Plus className="h-3 w-3" /> Sócio</button>
          </div>
          <div className="space-y-2">
            {partners.map((p) => {
              const share = (profit * (p.percent || 0)) / 100;
              return (
                <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={p.name}
                      onChange={(e) => updatePartner(p.id, { name: e.target.value })}
                      className="flex-1 bg-transparent px-1 text-sm font-medium outline-none"
                    />
                    <input
                      type="number"
                      value={p.percent}
                      onChange={(e) => updatePartner(p.id, { percent: parseFloat(e.target.value) || 0 })}
                      className="w-16 rounded-lg bg-black/40 px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <button onClick={() => removePartner(p.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full bg-fire" style={{ width: `${Math.min(100, p.percent)}%` }} />
                    </div>
                    <span className={`ml-3 text-sm font-bold ${share >= 0 ? "text-emerald-400" : "text-red-400"}`}>{brl(share)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-muted-foreground">Total distribuído</span>
            <span className={`font-display text-lg font-bold ${totalPercent === 100 ? "text-emerald-400" : "text-yellow-400"}`}>
              {totalPercent}%{totalPercent !== 100 && " ⚠"}
            </span>
          </div>
          {totalPercent !== 100 && (
            <p className="mt-1 text-[11px] text-yellow-400/80">A soma dos percentuais precisa fechar em 100%.</p>
          )}
        </div>
      </div>
    </section>
  );
}

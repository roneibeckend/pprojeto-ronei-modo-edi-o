import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  BookOpen,
  Play,
  TrendingUp,
  Activity,
  Plus,
  Settings,
  Video,
  ChefHat,
  FileSpreadsheet,
  Award,
  Calculator,
  Trash2,
  DollarSign,
  PieChart,
  Sparkles,
  Wand2,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { adminStats } from "@/lib/platform-data";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({ meta: [{ title: "Admin — Espetinho na Veia" }] }),
  component: AdminPage,
});

/* ---------------- Hooks & helpers ---------------- */

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setInView(true), io.disconnect()),
      { threshold }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ---------------- Page ---------------- */

function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Header with live status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Espetinho na Veia · Cockpit
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Painel{" "}
            <span className="bg-gradient-to-r from-fire via-gold to-fire bg-clip-text text-transparent">
              Administrativo
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão em tempo real da sua operação.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Operacional
            </span>
          </div>
          <button className="btn-fire text-sm">
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </div>
      </div>

      {/* Hero KPI strip */}
      <HeroKpis />

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat icon={Users} label="Alunos" value={adminStats.students} format="int" delay={0} />
        <AdminStat icon={GraduationCap} label="Cursos ativos" value={adminStats.activeCourses} format="int" delay={80} />
        <AdminStat icon={BookOpen} label="E-books" value={adminStats.ebooks} format="int" delay={160} />
        <AdminStat icon={Play} label="Aulas assistidas" value={adminStats.lessonsWatched} format="int" delay={240} />
        <AdminStat icon={TrendingUp} label="Conclusão média" value={adminStats.avgCompletion} suffix="%" delay={320} accent />
        <AdminStat icon={Activity} label="Ativos recentemente" value={adminStats.activeRecent} format="int" delay={400} />
        <AdminStat icon={Award} label="Certificados" value={1284} format="int" delay={480} />
        <AdminStat icon={TrendingUp} label="Faturamento" value={137240} format="brl" delay={560} accent />
      </div>

      {/* Chart + IA */}
      <div className="grid gap-6 lg:grid-cols-12">
        <ChartCard />
        <IaBanner />
      </div>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminAction icon={GraduationCap} title="Cadastrar curso" desc="Crie um novo curso e organize módulos." delay={0} />
        <AdminAction icon={Video} title="Upload de vídeos" desc="Envie aulas em MP4 direto para as trilhas." delay={60} />
        <AdminAction icon={BookOpen} title="Cadastrar e-book" desc="Publique um novo material na biblioteca." delay={120} />
        <AdminAction icon={ChefHat} title="Cadastrar receita" desc="Adicione receitas com custo e lucro." delay={180} />
        <AdminAction icon={FileSpreadsheet} title="Novo material" desc="Planilhas, PDFs e artes de divulgação." delay={240} />
        <AdminAction icon={Users} title="Gerenciar alunos" desc="Consulte, edite e libere acessos." delay={300} />
      </section>

      <FinancePanel />

      <StudentsTable />
    </div>
  );
}

/* ---------------- Hero KPIs ---------------- */

function HeroKpis() {
  const revenue = useCountUp(137240);
  const students = useCountUp(adminStats.students);
  const active = useCountUp(adminStats.activeRecent);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Faturamento total", value: brl(revenue), delta: "+12%", tone: "text-emerald-400" },
        { label: "Alunos", value: Math.round(students).toLocaleString("pt-BR"), delta: "High", tone: "text-fire" },
        { label: "Ativos agora", value: Math.round(active).toLocaleString("pt-BR"), delta: "Live", tone: "text-gold" },
      ].map((k, i) => (
        <div key={k.label} className="group relative animate-fade-in" style={{ animationDelay: `${i * 90}ms`, animationFillMode: "backwards" }}>
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-fire/60 via-gold/40 to-fire/60 opacity-30 blur transition duration-500 group-hover:opacity-70" />
          <div className="relative rounded-3xl border border-white/5 bg-charcoal/80 p-6 backdrop-blur">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {k.label}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-white">{k.value}</span>
              <span className={`text-sm font-bold ${k.tone}`}>{k.delta}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Stat cards ---------------- */

function AdminStat({
  icon: Icon,
  label,
  value,
  suffix,
  format,
  accent,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  format?: "int" | "brl";
  accent?: boolean;
  delay?: number;
}) {
  const v = useCountUp(value, 1400);
  const shown =
    format === "brl"
      ? brl(v)
      : format === "int"
      ? Math.round(v).toLocaleString("pt-BR")
      : `${Math.round(v)}${suffix || ""}`;

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-b ${accent ? "from-fire/60 to-gold/30" : "from-white/10 to-white/0"} opacity-40 blur-sm transition group-hover:opacity-80`} />
      <div className="relative h-full rounded-2xl border border-white/5 bg-charcoal/80 p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-gradient-to-br from-fire to-gold text-white shadow-fire" : "bg-white/5 text-fire"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {label}
            </div>
            <div className="font-display text-xl font-bold">{shown}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Chart ---------------- */

function ChartCard() {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setInView(true), 60);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...adminStats.chart);
  return (
    <section
      
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-charcoal/80 p-6 backdrop-blur lg:col-span-8"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fire/10 blur-3xl" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">
            Alunos ativos por mês
          </h3>
          <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
        </div>
        <select className="rounded-lg border border-white/10 bg-black/40 px-3 py-1 text-xs text-muted-foreground outline-none focus:border-fire">
          <option>12 meses</option>
          <option>6 meses</option>
        </select>
      </div>
      <div className="relative flex h-52 items-end gap-2">
        {adminStats.chart.map((v, i) => {
          const h = Math.round((v / max) * 180);
          const isPeak = v === max;
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-2">
              <div
                className={`relative w-full rounded-t-lg transition-[height] duration-1000 ease-out ${
                  isPeak
                    ? "bg-gradient-to-t from-fire via-fire to-gold shadow-[0_0_30px_rgba(255,77,0,0.4)]"
                    : "bg-gradient-to-t from-fire to-gold/70 group-hover:brightness-125"
                }`}

                style={{ height: inView ? `${h}px` : "0px", transitionDelay: `${i * 60}ms` }}
              >
                {isPeak && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-fire/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-fire">
                    Peak
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                M{i + 1}
              </span>
            </div>
          );
        })}


      </div>
    </section>
  );
}

/* ---------------- IA Banner ---------------- */

function IaBanner() {
  return (
    <Link
      to="/app/admin/ebook-ai"
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-fire via-fire/90 to-gold p-6 shadow-[0_20px_60px_-15px_rgba(255,77,0,0.5)] transition hover:scale-[1.01] lg:col-span-4"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-3xl transition duration-700 group-hover:scale-150" />
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      </div>
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-black/20 backdrop-blur">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
            Novo
          </span>
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-white/80">
            <Sparkles className="h-3 w-3" /> IA Generativa
          </span>
        </div>
        <h3 className="font-display text-2xl font-bold uppercase leading-tight text-white">
          Criar ebook<br />com IA
        </h3>
        <p className="mt-2 text-sm leading-snug text-white/80">
          Descreva o tema. A IA escreve e transforma no formato interativo premium em segundos.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 self-start rounded-xl bg-black px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition group-hover:bg-black/80">
          Gerar agora <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* ---------------- Actions ---------------- */

function AdminAction({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <button
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-charcoal/80 p-5 text-left transition hover:-translate-y-1 hover:border-fire/40 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fire/5 blur-2xl transition group-hover:bg-fire/20" />
      <div className="relative flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fire to-gold text-white shadow-fire transition group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fire" />
      </div>
    </button>
  );
}

/* ---------------- Students Table ---------------- */

function StudentsTable() {
  const rows = [
    ["André Silva", "andre@exemplo.com", "Espetinho Lucrativo", 42],
    ["Mariana Costa", "mari@exemplo.com", "Molhos e Acompanhamentos", 78],
    ["Carlos Mendes", "carlos@exemplo.com", "Como Vender Mais", 15],
    ["Fernanda Rocha", "fe@exemplo.com", "Gestão do Negócio", 60],
    ["Tiago Almeida", "tiago@exemplo.com", "Espetinho Lucrativo", 92],
  ] as const;
  return (
    <section className="overflow-hidden rounded-3xl border border-white/5 bg-charcoal/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">
            Últimos alunos
          </h3>
          <p className="text-xs text-muted-foreground">Cadastros recentes</p>
        </div>
        <button className="text-xs font-bold uppercase tracking-widest text-fire hover:text-gold">
          Ver todos →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="bg-white/[0.03] text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <th className="px-6 py-4 font-bold">Aluno</th>
              <th className="px-6 py-4 font-bold">E-mail</th>
              <th className="px-6 py-4 font-bold">Curso</th>
              <th className="px-6 py-4 text-right font-bold">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r, i) => {
              const initials = (r[0] as string)
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("");
              const pct = r[3] as number;
              return (
                <tr
                  key={r[1] as string}
                  className="group animate-fade-in transition hover:bg-white/[0.03]"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fire to-gold text-xs font-bold text-white shadow-fire">
                        {initials}
                      </div>
                      <span className="font-medium">{r[0]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{r[1]}</td>
                  <td className="px-6 py-4">{r[2]}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-fire to-gold transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-display font-bold text-fire">
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------------- Finance ---------------- */

type Cost = { id: string; label: string; value: number };
type Partner = { id: string; name: string; percent: number };

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
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-charcoal/80 p-6 backdrop-blur">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fire to-gold text-white shadow-fire">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Painel Financeiro
            </div>
            <h3 className="font-display text-xl font-bold uppercase">
              Custos, lucro e divisão de sócios
            </h3>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs">
          Margem líquida:{" "}
          <span className={`font-bold ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {margin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-3">
        {/* Receita */}
        <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Receita bruta
          </div>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-display text-2xl font-bold text-emerald-400 outline-none transition focus:border-fire"
          />
          <div className="mt-2 text-xs text-muted-foreground">{brl(revenue)}</div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita</span>
              <span className="font-semibold text-emerald-400">{brl(revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custos totais</span>
              <span className="font-semibold text-red-400">− {brl(totalCost)}</span>
            </div>
            <div className="my-2 border-t border-white/10" />
            <div className="flex justify-between">
              <span className="font-semibold">Lucro líquido</span>
              <span
                className={`font-display text-xl font-bold ${
                  profit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {brl(profit)}
              </span>
            </div>
          </div>
        </div>

        {/* Custos */}
        <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" /> Custos da empresa
            </div>
            <button onClick={addCost} className="btn-ghost-fire text-xs">
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {costs.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2 transition hover:border-fire/30"
              >
                <input
                  value={c.label}
                  onChange={(e) => updateCost(c.id, { label: e.target.value })}
                  className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                />
                <input
                  type="number"
                  value={c.value}
                  onChange={(e) =>
                    updateCost(c.id, { value: parseFloat(e.target.value) || 0 })
                  }
                  className="w-28 rounded-lg bg-black/40 px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-fire"
                />
                <button
                  onClick={() => removeCost(c.id)}
                  className="text-muted-foreground transition hover:text-red-400"
                >
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
        <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              <PieChart className="h-4 w-4" /> Divisão do lucro
            </div>
            <button onClick={addPartner} className="btn-ghost-fire text-xs">
              <Plus className="h-3 w-3" /> Sócio
            </button>
          </div>
          <div className="space-y-2">
            {partners.map((p) => {
              const share = (profit * (p.percent || 0)) / 100;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-gold/30"
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={p.name}
                      onChange={(e) => updatePartner(p.id, { name: e.target.value })}
                      className="flex-1 bg-transparent px-1 text-sm font-medium outline-none"
                    />
                    <input
                      type="number"
                      value={p.percent}
                      onChange={(e) =>
                        updatePartner(p.id, { percent: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 rounded-lg bg-black/40 px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-fire"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <button
                      onClick={() => removePartner(p.id)}
                      className="text-muted-foreground transition hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-fire to-gold transition-all duration-700"
                        style={{ width: `${Math.min(100, p.percent)}%` }}
                      />
                    </div>
                    <span
                      className={`ml-3 text-sm font-bold ${
                        share >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {brl(share)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-muted-foreground">Total distribuído</span>
            <span
              className={`font-display text-lg font-bold ${
                totalPercent === 100 ? "text-emerald-400" : "text-yellow-400"
              }`}
            >
              {totalPercent}%{totalPercent !== 100 && " ⚠"}
            </span>
          </div>
          {totalPercent !== 100 && (
            <p className="mt-1 text-[11px] text-yellow-400/80">
              A soma dos percentuais precisa fechar em 100%.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* keep unused imports referenced to avoid tree-shake surprises */

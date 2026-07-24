import { createFileRoute } from "@tanstack/react-router";
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
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { adminStats } from "@/lib/platform-data";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({ meta: [{ title: "Admin — Espetinho na Veia" }] }),
  component: AdminPage,
});

/* ---------------- Helpers ---------------- */

const ORANGE = "#ff6a00";

function useCountUp(target: number, duration = 1100) {
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-sm border-l-2 border-[color:var(--orange)] pl-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50" style={{ ["--orange" as any]: ORANGE }}>
            Espetinho na Veia · Cockpit
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl">
            Painel <span style={{ color: ORANGE }}>Administrativo</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Visão em tempo real da sua operação.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Operacional
            </span>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-bold uppercase tracking-widest text-black transition hover:brightness-110"
            style={{ backgroundColor: ORANGE }}
          >
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </div>
      </header>

      {/* Hero KPIs */}
      <HeroKpis />

      {/* Secondary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat icon={Users} label="Alunos" value={adminStats.students} format="int" delay={0} />
        <AdminStat icon={GraduationCap} label="Cursos ativos" value={adminStats.activeCourses} format="int" delay={60} />
        <AdminStat icon={BookOpen} label="E-books" value={adminStats.ebooks} format="int" delay={120} />
        <AdminStat icon={Play} label="Aulas assistidas" value={adminStats.lessonsWatched} format="int" delay={180} />
        <AdminStat icon={TrendingUp} label="Conclusão média" value={adminStats.avgCompletion} suffix="%" delay={240} accent />
        <AdminStat icon={Activity} label="Ativos recentemente" value={adminStats.activeRecent} format="int" delay={300} />
        <AdminStat icon={Award} label="Certificados" value={1284} format="int" delay={360} />
        <AdminStat icon={TrendingUp} label="Faturamento" value={137240} format="brl" delay={420} accent />
      </div>

      {/* Chart */}
      <ChartCard />

      {/* Quick actions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white/60">
            Ações rápidas
          </h2>
          <div className="h-px flex-1 mx-4 bg-white/5" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminAction icon={GraduationCap} title="Cadastrar curso" desc="Crie um novo curso e organize módulos." delay={0} />
          <AdminAction icon={Video} title="Upload de vídeos" desc="Envie aulas em MP4 direto para as trilhas." delay={40} />
          <AdminAction icon={BookOpen} title="Cadastrar e-book" desc="Publique um novo material na biblioteca." delay={80} />
          <AdminAction icon={ChefHat} title="Cadastrar receita" desc="Adicione receitas com custo e lucro." delay={120} />
          <AdminAction icon={FileSpreadsheet} title="Novo material" desc="Planilhas, PDFs e artes de divulgação." delay={160} />
          <AdminAction icon={Users} title="Gerenciar alunos" desc="Consulte, edite e libere acessos." delay={200} />
        </div>
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

  const items = [
    { label: "Faturamento total", value: brl(revenue), delta: "+12%", up: true, icon: DollarSign },
    { label: "Alunos matriculados", value: Math.round(students).toLocaleString("pt-BR"), delta: "+8%", up: true, icon: Users },
    { label: "Ativos agora", value: Math.round(active).toLocaleString("pt-BR"), delta: "Live", up: true, icon: Activity },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((k, i) => {
        const Icon = k.icon;
        return (
          <div
            key={k.label}
            className="group relative overflow-hidden border border-white/5 bg-[#111] p-6 transition hover:border-[color:var(--orange)]"
            style={{ ["--orange" as any]: ORANGE, animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
          >
            {/* Left orange bar */}
            <span className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: ORANGE }} />

            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                {k.label}
              </p>
              <div className="grid h-9 w-9 place-items-center rounded-sm bg-[#ff6a00]/10 text-[color:var(--orange)]">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold tracking-tight text-white">
                {k.value}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${k.up ? "text-emerald-400" : "text-red-400"}`}>
                {k.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {k.delta}
              </span>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden bg-white/5">
              <div
                className="h-full transition-all duration-1000"
                style={{ backgroundColor: ORANGE, width: `${60 + i * 12}%` }}
              />
            </div>
          </div>
        );
      })}
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
  const v = useCountUp(value, 1300);
  const shown =
    format === "brl"
      ? brl(v)
      : format === "int"
      ? Math.round(v).toLocaleString("pt-BR")
      : `${Math.round(v)}${suffix || ""}`;

  return (
    <div
      className="group relative border border-white/5 bg-[#111] p-4 transition hover:border-[color:var(--orange)] animate-fade-in"
      style={{ ["--orange" as any]: ORANGE, animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-sm ${
            accent ? "text-black" : "bg-white/[0.04] text-[color:var(--orange)]"
          }`}
          style={accent ? { backgroundColor: ORANGE } : undefined}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            {label}
          </div>
          <div className="font-display text-xl font-extrabold text-white">{shown}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Chart ---------------- */

function ChartCard() {
  const { ref, inView } = useInView<HTMLElement>(0.1);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);
  const show = inView || ready;

  const max = Math.max(...adminStats.chart);
  return (
    <section
      ref={ref}
      className="border border-white/5 bg-[#111] p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-sm" style={{ backgroundColor: ORANGE }}>
            <BarChart3 className="h-5 w-5 text-black" />
          </div>
          <div>
            <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-white">
              Alunos ativos por mês
            </h3>
            <p className="text-xs text-white/40">Últimos 12 meses</p>
          </div>
        </div>
        <select className="rounded-sm border border-white/10 bg-black px-3 py-1.5 text-xs font-medium text-white/70 outline-none focus:border-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE }}>
          <option>12 meses</option>
          <option>6 meses</option>
        </select>
      </div>
      <div className="relative flex h-56 items-end gap-2">
        {adminStats.chart.map((v, i) => {
          const h = Math.round((v / max) * 190);
          const isPeak = v === max;
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative w-full flex justify-center">
                {isPeak && (
                  <span className="absolute -top-6 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black" style={{ backgroundColor: ORANGE }}>
                    Peak
                  </span>
                )}
              </div>
              <div
                className="relative w-full transition-[height] duration-1000 ease-out"
                style={{
                  height: show ? `${h}px` : "0px",
                  transitionDelay: `${i * 50}ms`,
                  backgroundColor: isPeak ? ORANGE : "#7a3300",
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: isPeak ? "#ffb066" : ORANGE }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                M{i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </section>
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
      className="group relative overflow-hidden border border-white/5 bg-[#111] p-5 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--orange)] animate-fade-in"
      style={{ ["--orange" as any]: ORANGE, animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100" style={{ backgroundColor: ORANGE }} />
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-black transition group-hover:scale-105" style={{ backgroundColor: ORANGE }}>
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-extrabold uppercase tracking-wide text-white">{title}</div>
          <p className="mt-1 text-xs text-white/50">{desc}</p>
        </div>
        <ArrowUpRight className="ml-auto h-4 w-4 text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--orange)]" />
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
    <section className="overflow-hidden border border-white/5 bg-[#111]">
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1" style={{ backgroundColor: ORANGE }} />
          <div>
            <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-white">
              Últimos alunos
            </h3>
            <p className="text-xs text-white/40">Cadastros recentes</p>
          </div>
        </div>
        <button className="text-xs font-bold uppercase tracking-widest transition hover:brightness-125" style={{ color: ORANGE }}>
          Ver todos →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.22em] text-white/40">
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
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-sm text-xs font-extrabold text-black" style={{ backgroundColor: ORANGE }}>
                        {initials}
                      </div>
                      <span className="font-medium text-white">{r[0]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/50">{r[1]}</td>
                  <td className="px-6 py-4 text-white/80">{r[2]}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-1.5 w-24 overflow-hidden bg-white/5">
                        <div
                          className="h-full transition-all duration-1000"
                          style={{ width: `${pct}%`, backgroundColor: ORANGE }}
                        />
                      </div>
                      <span className="w-10 text-right font-display font-extrabold" style={{ color: ORANGE }}>
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
    <section className="border border-white/5 bg-[#111] p-6" style={{ ["--orange" as any]: ORANGE }}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-sm text-black" style={{ backgroundColor: ORANGE }}>
            <Calculator className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              Painel Financeiro
            </div>
            <h3 className="font-display text-xl font-extrabold uppercase text-white">
              Custos, lucro e divisão de sócios
            </h3>
          </div>
        </div>
        <div className="rounded-sm border border-white/10 bg-black px-4 py-2 text-xs">
          <span className="text-white/50">Margem líquida:</span>{" "}
          <span className={`font-bold ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {margin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Receita */}
        <div className="border border-white/5 bg-black/40 p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
            <DollarSign className="h-4 w-4" style={{ color: ORANGE }} /> Receita bruta
          </div>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-sm border border-white/10 bg-black px-4 py-3 font-display text-2xl font-extrabold text-emerald-400 outline-none transition focus:border-[color:var(--orange)]"
          />
          <div className="mt-2 text-xs text-white/40">{brl(revenue)}</div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Receita</span>
              <span className="font-semibold text-emerald-400">{brl(revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Custos totais</span>
              <span className="font-semibold text-red-400">− {brl(totalCost)}</span>
            </div>
            <div className="my-2 border-t border-white/10" />
            <div className="flex justify-between">
              <span className="font-semibold text-white">Lucro líquido</span>
              <span
                className={`font-display text-xl font-extrabold ${
                  profit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {brl(profit)}
              </span>
            </div>
          </div>
        </div>

        {/* Custos */}
        <div className="border border-white/5 bg-black/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <FileSpreadsheet className="h-4 w-4" style={{ color: ORANGE }} /> Custos da empresa
            </div>
            <button
              onClick={addCost}
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black transition hover:brightness-110"
              style={{ backgroundColor: ORANGE }}
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {costs.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 border border-white/10 bg-black/40 p-2 transition hover:border-[color:var(--orange)]"
              >
                <input
                  value={c.label}
                  onChange={(e) => updateCost(c.id, { label: e.target.value })}
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-white outline-none"
                />
                <input
                  type="number"
                  value={c.value}
                  onChange={(e) =>
                    updateCost(c.id, { value: parseFloat(e.target.value) || 0 })
                  }
                  className="w-28 rounded-sm bg-black px-2 py-1 text-right text-sm text-white outline-none"
                />
                <button
                  onClick={() => removeCost(c.id)}
                  className="text-white/30 transition hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-white/50">Total de custos</span>
            <span className="font-display text-lg font-extrabold text-red-400">{brl(totalCost)}</span>
          </div>
        </div>

        {/* Sócios */}
        <div className="border border-white/5 bg-black/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <PieChart className="h-4 w-4" style={{ color: ORANGE }} /> Divisão do lucro
            </div>
            <button
              onClick={addPartner}
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black transition hover:brightness-110"
              style={{ backgroundColor: ORANGE }}
            >
              <Plus className="h-3 w-3" /> Sócio
            </button>
          </div>
          <div className="space-y-2">
            {partners.map((p) => {
              const share = (profit * (p.percent || 0)) / 100;
              return (
                <div
                  key={p.id}
                  className="border border-white/10 bg-black/40 p-3 transition hover:border-[color:var(--orange)]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={p.name}
                      onChange={(e) => updatePartner(p.id, { name: e.target.value })}
                      className="flex-1 bg-transparent px-1 text-sm font-medium text-white outline-none"
                    />
                    <input
                      type="number"
                      value={p.percent}
                      onChange={(e) =>
                        updatePartner(p.id, { percent: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 rounded-sm bg-black px-2 py-1 text-right text-sm text-white outline-none"
                    />
                    <span className="text-xs text-white/40">%</span>
                    <button
                      onClick={() => removePartner(p.id)}
                      className="text-white/30 transition hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-1.5 flex-1 overflow-hidden bg-white/5">
                      <div
                        className="h-full transition-all duration-700"
                        style={{ width: `${Math.min(100, p.percent)}%`, backgroundColor: ORANGE }}
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
            <span className="text-white/50">Total distribuído</span>
            <span
              className={`font-display text-lg font-extrabold ${
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

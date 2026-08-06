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
  Clapperboard,
  Flame,
  LayoutTemplate,
  UserCog,
  Library,
  Award,
  Calculator,
  Trash2,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Command,
  Sparkles,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { adminStats } from "@/lib/platform-data";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Painel Admin" }] }),
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <ChartCard />

        {/* Quick actions */}
        <section className="flex flex-col">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                <Command className="h-3 w-3" style={{ color: ORANGE }} /> Painel de Controle
              </div>
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white">
                Operações de Conteúdo
              </h2>
            </div>
          </div>
          <div className="flex-1 grid gap-3">
            <AdminAction index={1} icon={Sparkles} title="Painel Central Administrativo" desc="ACESSO AO NOVO PAINEL DE GESTÃO (/admin)." to="/admin" highlight accentColor="#ff6a00" />
            <AdminAction index={2} icon={Library} title="Gerenciar Cursos" desc="Upload de cursos manuais ou trilhas IA." shortcut="C" delay={0} to="/app/admin/conteudo" />
            <AdminAction index={3} icon={Clapperboard} title="Aulas ao Vivo" desc="Agende e gerencie transmissões em tempo real." shortcut="V" delay={40} to="/app/admin/ao-vivo" />
            <AdminAction index={4} icon={Sparkles} title="IA · Gerador de Ebook" desc="Crie conteúdo interativo premium com um prompt." meta="Lovable AI" shortcut="I" delay={80} to="/app/admin/ebook-ai" />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         {/* Finance Shortcut */}
         <section className="border border-white/5 bg-[#111] p-6">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5" style={{ color: ORANGE }} />
                  <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-white">Saúde Financeira</h3>
               </div>
               <Link to="/app/admin/financeiro" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--orange)] hover:brightness-125" style={{ ["--orange" as any]: ORANGE }}>Abrir Painel →</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-black/40 p-4 border border-white/5">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Lucro Estimado</div>
                  <div className="text-xl font-display font-extrabold text-emerald-400">R$ 83.340,00</div>
               </div>
               <div className="bg-black/40 p-4 border border-white/5">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Margem Líquida</div>
                  <div className="text-xl font-display font-extrabold text-white">60.7%</div>
               </div>
            </div>
         </section>

         {/* Students Shortcut */}
         <section className="border border-white/5 bg-[#111] p-6">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <Users className="h-5 w-5" style={{ color: ORANGE }} />
                  <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-white">Últimos Alunos</h3>
               </div>
               <Link to="/app/admin/alunos" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--orange)] hover:brightness-125" style={{ ["--orange" as any]: ORANGE }}>Ver Analítico →</Link>
            </div>
            <div className="space-y-3">
                {[
                  { name: "André Silva", pct: 42 },
                  { name: "Mariana Costa", pct: 78 },
                  { name: "Carlos Mendes", pct: 15 }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 p-2 text-xs">
                    <span className="font-medium text-white/80">{s.name}</span>
                    <div className="flex items-center gap-2">
                       <div className="h-1 w-12 bg-white/5 overflow-hidden">
                          <div className="h-full bg-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE, width: `${s.pct}%` }} />
                       </div>
                       <span className="font-bold text-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE }}>{s.pct}%</span>
                    </div>
                  </div>
                ))}
            </div>
         </section>
      </div>
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
          <option>Customizado</option>
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
  meta,
  shortcut,
  index,
  delay = 0,
  to,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  meta?: string;
  shortcut?: string;
  index?: number;
  delay?: number;
  to?: string;
  highlight?: boolean;
}) {
  const className = `group relative overflow-hidden border ${highlight ? "border-[color:var(--orange)]/60" : "border-white/[0.07]"} bg-gradient-to-b from-[#161616] to-[#0d0d0d] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--orange)]/60 hover:shadow-[0_20px_50px_-20px_rgba(255,106,0,0.55)] animate-fade-in block`;
  const style = { ["--orange" as any]: ORANGE, animationDelay: `${delay}ms`, animationFillMode: "backwards" as const };
  const inner = (
    <>
      {/* Sheen overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-all duration-700 group-hover:left-full"
      />
      {/* Corner ticks */}
      <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-white/20 transition-colors group-hover:border-[color:var(--orange)]" />
      <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-white/20 transition-colors group-hover:border-[color:var(--orange)]" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b border-l border-white/20 transition-colors group-hover:border-[color:var(--orange)]" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-white/20 transition-colors group-hover:border-[color:var(--orange)]" />
      {/* Left ember bar */}
      <span className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100" style={{ backgroundColor: ORANGE, boxShadow: `0 0 20px ${ORANGE}` }} />

      {/* Index number */}
      {index !== undefined && (
        <span className="absolute right-5 top-4 font-display text-[10px] font-bold tracking-[0.2em] text-white/25">
          0{index}
        </span>
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon medallion */}
        <div className="relative shrink-0">
          <span aria-hidden className="absolute inset-0 rounded-full opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70" style={{ backgroundColor: ORANGE }} />
          <div
            className="relative grid h-12 w-12 place-items-center rounded-sm border transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]"
            style={{
              borderColor: `${ORANGE}55`,
              background: `linear-gradient(135deg, ${ORANGE} 0%, #cc4a00 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -2px ${ORANGE}66`,
            }}
          >
            <Icon className="h-5 w-5 text-black" strokeWidth={2.5} />
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <div className="font-display text-[15px] font-extrabold uppercase tracking-wide text-white">
            {title}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{desc}</p>
        </div>
      </div>

      {/* Footer meta */}
      <div className="relative mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        {meta && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: ORANGE }} />
            {meta}
          </span>
        )}
        <div className="flex items-center gap-2">
          {shortcut && (
            <kbd className="hidden items-center gap-0.5 rounded-sm border border-white/10 bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/50 group-hover:border-[color:var(--orange)]/40 group-hover:text-white/80 sm:inline-flex">
              <Command className="h-2.5 w-2.5" />{shortcut}
            </kbd>
          )}
          <ArrowUpRight className="h-4 w-4 text-white/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--orange)]" />
        </div>
      </div>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className} style={style}>{inner}</Link>
    );
  }
  return (
    <button className={className} style={style}>{inner}</button>
  );
}

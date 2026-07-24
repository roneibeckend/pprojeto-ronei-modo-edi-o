import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Circle,
  Coins, DollarSign, Flame, Grid3x3, Lightbulb, ListChecks, Lock, MessageCircle,
  Package, PartyPopper, PiggyBank, Play, RefreshCw, Rocket, Sparkles, Star,
  Target, ThumbsDown, ThumbsUp, Trophy, Users, X, Zap, ChefHat, Instagram,
  Camera, Calendar, TrendingUp, ShieldCheck, AlertTriangle, Award, Heart,
} from "lucide-react";
import { IMG } from "@/lib/platform-data";

export const Route = createFileRoute("/app/ebooks/premium/$ebookId")({
  head: () => ({
    meta: [{ title: "Do Zero aos 10k — Ebook Premium Interativo" }],
  }),
  component: PremiumReader,
});

/* ---------------------------- helpers ---------------------------- */
const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Pill({ children, tone = "fire" }: { children: React.ReactNode; tone?: "fire" | "gold" | "muted" }) {
  const tones: Record<string, string> = {
    fire: "bg-fire/15 text-fire border-fire/30",
    gold: "bg-gold/15 text-gold border-gold/30",
    muted: "bg-white/5 text-muted-foreground border-white/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

function SlideShell({
  chapter,
  title,
  children,
  cover,
}: {
  chapter?: string;
  title?: string;
  children: React.ReactNode;
  cover?: boolean;
}) {
  return (
    <div className={`animate-fade-in mx-auto flex h-full w-full max-w-5xl flex-col ${cover ? "justify-center text-center" : "justify-start"} p-6 sm:p-10`}>
      {chapter && !cover && (
        <div className="mb-3"><Pill tone="gold"><Sparkles className="h-3 w-3" />{chapter}</Pill></div>
      )}
      {title && !cover && (
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
      )}
      <div className={`${cover ? "" : "mt-6"} flex-1`}>{children}</div>
    </div>
  );
}

/* ---------------------------- slide components ---------------------------- */

function CoverSlide() {
  return (
    <SlideShell cover>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-charcoal/60 to-fire/20 p-10 sm:p-16">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fire/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <Pill tone="fire"><Flame className="h-3 w-3" />Ebook Premium · Interativo</Pill>
          <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] sm:text-7xl">
            Do Zero <span className="text-fire">aos R$ 10k</span>
            <br />com Espetinho
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            O manual definitivo pra sair do rascunho, evitar os gastos que quebram novos negócios e virar referência no seu bairro.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Pill tone="muted"><BookOpen className="h-3 w-3" />30 páginas</Pill>
            <Pill tone="muted"><Zap className="h-3 w-3" />Interativo</Pill>
            <Pill tone="muted"><Trophy className="h-3 w-3" />Baseado em resultados reais</Pill>
          </div>
          <div className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="h-4 w-4 text-fire" /> Use as setas ← → ou os botões pra navegar
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function PromiseSlide() {
  const stats = [
    { k: "R$ 300+", v: "por dia é totalmente viável", icon: DollarSign },
    { k: "R$ 500", v: "é o suficiente pra começar", icon: PiggyBank },
    { k: "30 dias", v: "pra suas primeiras vendas", icon: Rocket },
  ];
  return (
    <SlideShell chapter="Boas-vindas" title="O que você vai conquistar até a última página">
      <p className="text-lg text-muted-foreground">
        Este ebook não é teoria. É o mesmo roteiro que fez o Ronnei sair do zero e chegar aos R$ 350.000/mês. Aqui está o mapa.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:scale-105 hover:border-fire/50">
            <s.icon className="h-8 w-8 text-fire" />
            <div className="mt-3 font-display text-3xl font-bold">{s.k}</div>
            <div className="text-sm text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function TocSlide({ jump }: { jump: (i: number) => void }) {
  const items = [
    "Mentalidade de quem faz acontecer",
    "Começando com pouco dinheiro",
    "Equipamentos essenciais",
    "Escolha das carnes",
    "Cortes e rendimento",
    "Tempero que fideliza",
    "Brasa perfeita",
    "Ponto da carne",
    "Montagem profissional",
    "Custo por espetinho",
    "Precificação lucrativa",
    "Combos que vendem",
    "Evitar desperdícios",
    "Fornecedores",
    "Higiene e segurança",
    "WhatsApp que vende",
    "Instagram que atrai",
    "Fotos irresistíveis",
    "Fidelização",
    "Da renda extra ao negócio",
    "Quiz rápido",
    "Plano de 30 dias",
    "Erros que quebram",
    "Suas metas",
    "Parabéns",
  ];
  return (
    <SlideShell chapter="Sumário" title="Trilha completa em 30 páginas">
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((t, i) => (
          <button
            key={i}
            onClick={() => jump(i + 4)}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition hover:border-fire/50 hover:bg-fire/5"
          >
            <span className="font-display text-lg font-bold text-fire">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 text-sm">{t}</span>
            <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </SlideShell>
  );
}

function MindsetSlide() {
  const [picked, setPicked] = useState<string[]>([]);
  const reasons = [
    "Renda extra pra família",
    "Sair do CLT",
    "Pagar dívidas",
    "Ter meu próprio negócio",
    "Comprar minha casa",
    "Viver do que amo",
  ];
  return (
    <SlideShell chapter="Capítulo 1" title="Mentalidade de quem faz acontecer">
      <p className="text-muted-foreground">
        Antes da carne, do carvão e do palito vem o motivo. Escolhe os seus. Vai marcar essa página no seu cérebro.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {reasons.map((r) => {
          const on = picked.includes(r);
          return (
            <button
              key={r}
              onClick={() => setPicked((p) => on ? p.filter((x) => x !== r) : [...p, r])}
              className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-fire bg-fire text-white scale-105" : "border-white/15 bg-white/[0.03] hover:border-fire/40"}`}
            >
              {on && <Check className="mr-1 inline h-3 w-3" />}
              {r}
            </button>
          );
        })}
      </div>
      {picked.length > 0 && (
        <div className="animate-fade-in mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <Lightbulb className="h-5 w-5 text-gold" />
          <p className="mt-2 text-sm">
            Seus {picked.length} motivos são a razão pela qual você não vai desistir na primeira semana difícil. <b className="text-gold">Volte aqui sempre que bater dúvida.</b>
          </p>
        </div>
      )}
    </SlideShell>
  );
}

function InvestmentSlide() {
  const [budget, setBudget] = useState(800);
  const rows = useMemo(() => {
    const carvao = Math.round(budget * 0.08);
    const carne = Math.round(budget * 0.45);
    const equip = Math.round(budget * 0.25);
    const emb = Math.round(budget * 0.1);
    const divulg = Math.round(budget * 0.12);
    return [
      { l: "Carnes iniciais (10kg mix)", v: carne, i: Package },
      { l: "Churrasqueira + acessórios", v: equip, i: Flame },
      { l: "Carvão + acendedor", v: carvao, i: Flame },
      { l: "Embalagens e palitos", v: emb, i: Package },
      { l: "Divulgação inicial", v: divulg, i: Instagram },
    ];
  }, [budget]);
  return (
    <SlideShell chapter="Capítulo 2" title="Começando com pouco dinheiro">
      <p className="text-muted-foreground">
        Ajuste seu orçamento no controle abaixo e veja como distribuir cada real sem quebrar antes de começar.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Meu orçamento inicial</span>
          <span className="font-display text-3xl font-bold text-fire">{BRL(budget)}</span>
        </div>
        <input
          type="range"
          min={500}
          max={2000}
          step={50}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-3 w-full accent-[oklch(0.63_0.24_27)]"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>R$ 500</span><span>R$ 2.000</span>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <r.i className="h-5 w-5 text-fire" />
            <span className="flex-1 text-sm">{r.l}</span>
            <span className="font-mono text-sm font-bold">{BRL(r.v)}</span>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function ChecklistSlide({ chapter, title, items, subtitle }: {
  chapter: string; title: string; items: string[]; subtitle?: string;
}) {
  const [done, setDone] = useState<number[]>([]);
  const pct = Math.round((done.length / items.length) * 100);
  return (
    <SlideShell chapter={chapter} title={title}>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-gradient-to-r from-fire to-gold transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold text-gold">{pct}%</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((it, i) => {
          const on = done.includes(i);
          return (
            <button
              key={i}
              onClick={() => setDone((d) => on ? d.filter((x) => x !== i) : [...d, i])}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${on ? "border-fire/50 bg-fire/10" : "border-white/10 bg-white/[0.02] hover:border-fire/30"}`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? "border-fire bg-fire" : "border-white/20"}`}>
                {on && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className={on ? "line-through opacity-60" : ""}>{it}</span>
            </button>
          );
        })}
      </div>
      {pct === 100 && (
        <div className="animate-fade-in mt-6 flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 p-4">
          <Trophy className="h-5 w-5 text-gold" /> <span className="text-sm font-semibold">Checklist completo — pode partir pro próximo capítulo!</span>
        </div>
      )}
    </SlideShell>
  );
}

function FlipCardsSlide() {
  const [flipped, setFlipped] = useState<number | null>(null);
  const cards = [
    { n: "Alcatra", pro: "Macia e visual premium", con: "Custo médio", best: "Espetinho carro-chefe" },
    { n: "Coxão mole", pro: "Custo-benefício", con: "Precisa de tempero forte", best: "Melhor pra escala" },
    { n: "Patinho", pro: "Barato e rende", con: "Menos macio", best: "Espeto econômico" },
    { n: "Frango + bacon", pro: "Alto ticket, baixo custo", con: "Requer atenção no ponto", best: "Combo mais lucrativo" },
  ];
  return (
    <SlideShell chapter="Capítulo 4" title="Escolha das carnes — toque pra virar">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <div
            key={i}
            onClick={() => setFlipped(flipped === i ? null : i)}
            className="group relative h-48 cursor-pointer [perspective:1000px]"
          >
            <div className={`absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-charcoal to-black p-5 shadow-xl transition-all duration-500 [transform-style:preserve-3d] ${flipped === i ? "[transform:rotateY(180deg)]" : ""}`}>
              <div className="absolute inset-0 flex flex-col justify-between rounded-2xl p-5 [backface-visibility:hidden]">
                <ChefHat className="h-8 w-8 text-fire" />
                <div>
                  <div className="font-display text-2xl font-bold">{c.n}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Toque pra ver detalhes</div>
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col gap-2 rounded-2xl bg-fire/10 p-5 text-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="font-display text-lg font-bold">{c.n}</div>
                <div className="flex gap-2"><ThumbsUp className="h-4 w-4 shrink-0 text-gold" /> {c.pro}</div>
                <div className="flex gap-2"><ThumbsDown className="h-4 w-4 shrink-0 text-fire" /> {c.con}</div>
                <div className="mt-auto rounded-lg bg-black/40 p-2 text-xs"><Star className="mr-1 inline h-3 w-3 text-gold" />{c.best}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function TabsSlide() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { n: "Cubos 3cm", body: "Padrão pro espetinho tradicional. Rende 6 cubos por espeto. Cozinha rápido e mantém suculência.", tip: "Corte contra a fibra sempre." },
    { n: "Tiras finas", body: "Perfeito pra bovino nobre. Enrola no espeto criando efeito visual premium. Ticket mais alto.", tip: "Bata a carne pra amaciar antes." },
    { n: "Cubos 2cm", body: "Ideal pra frango. Cozinha por igual e evita ressecar. Combine com bacon pra fidelizar.", tip: "Não misture cortes no mesmo espeto." },
  ];
  return (
    <SlideShell chapter="Capítulo 5" title="Cortes que rendem mais">
      <div className="mt-4 flex gap-2 border-b border-white/10">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-semibold transition ${tab === i ? "border-b-2 border-fire text-fire" : "text-muted-foreground hover:text-white"}`}
          >
            {t.n}
          </button>
        ))}
      </div>
      <div className="animate-fade-in mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6" key={tab}>
        <p className="text-lg">{tabs[tab].body}</p>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <Lightbulb className="h-5 w-5 shrink-0 text-gold" />
          <span className="text-sm"><b>Dica de ouro:</b> {tabs[tab].tip}</span>
        </div>
      </div>
    </SlideShell>
  );
}

function RevealSlide() {
  const [open, setOpen] = useState<number[]>([]);
  const items = [
    { t: "Sal grosso moído na hora", d: "Textura crocante por fora, sem salgar demais por dentro. Pó comum resseca." },
    { t: "Alho + cebola em pó", d: "Não queima na brasa, diferente do fresco. Camada de sabor uniforme." },
    { t: "Páprica defumada", d: "Cor viva e sabor de churrasco de fim de semana. Cliente sente na primeira mordida." },
    { t: "Descanso de 4 horas", d: "Menos que isso, tempero fica só na superfície. Mais que 24h, resseca." },
  ];
  return (
    <SlideShell chapter="Capítulo 6" title="Tempero que fideliza">
      <p className="text-muted-foreground">Toque em cada item pra revelar o porquê.</p>
      <div className="mt-6 space-y-3">
        {items.map((it, i) => {
          const on = open.includes(i);
          return (
            <button
              key={i}
              onClick={() => setOpen((o) => on ? o.filter((x) => x !== i) : [...o, i])}
              className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-fire/40"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${on ? "bg-fire" : "bg-white/10"}`}>
                  {on ? <Sparkles className="h-4 w-4 text-white" /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <span className="flex-1 font-semibold">{it.t}</span>
                <ChevronRight className={`h-5 w-5 transition ${on ? "rotate-90 text-fire" : ""}`} />
              </div>
              {on && <p className="animate-fade-in mt-3 pl-11 text-sm text-muted-foreground">{it.d}</p>}
            </button>
          );
        })}
      </div>
    </SlideShell>
  );
}

function TimelineSlide() {
  const steps = [
    { t: "0min", l: "Acenda o carvão", d: "Use acendedor natural, nunca álcool." },
    { t: "20min", l: "Cinza branca", d: "Sinal de brasa pronta. Espalhe uniformemente." },
    { t: "25min", l: "Grelha aquecida", d: "Mão a 20cm por 3s: dor = pronto." },
    { t: "30min", l: "Primeiro espeto", d: "Comece pelo bovino, ele guia o ritmo." },
  ];
  return (
    <SlideShell chapter="Capítulo 7" title="Brasa perfeita — linha do tempo">
      <div className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-fire bg-fire/20 font-display text-sm font-bold text-fire">
                {s.t}
              </div>
              {i < steps.length - 1 && <div className="my-1 w-0.5 flex-1 bg-gradient-to-b from-fire to-transparent" />}
            </div>
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-display text-lg font-bold">{s.l}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function PointPickerSlide() {
  const [p, setP] = useState(1);
  const pts = [
    { n: "Mal passado", c: "text-red-400", d: "Interior 50°C. Só pra clientes que pedem." },
    { n: "Ao ponto", c: "text-fire", d: "Interior 60°C. Ponto ideal pra 90% dos clientes." },
    { n: "Bem passado", c: "text-amber-500", d: "Interior 71°C. Cuidado pra não ressecar." },
  ];
  return (
    <SlideShell chapter="Capítulo 8" title="Ponto da carne — escolha e descubra">
      <div className="mt-6 flex gap-3">
        {pts.map((pt, i) => (
          <button
            key={i}
            onClick={() => setP(i)}
            className={`flex-1 rounded-2xl border p-4 transition ${p === i ? "border-fire bg-fire/10 scale-105" : "border-white/10 bg-white/[0.02] hover:border-fire/30"}`}
          >
            <div className={`font-display text-lg font-bold ${pt.c}`}>{pt.n}</div>
          </button>
        ))}
      </div>
      <div className="animate-fade-in mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6" key={p}>
        <p className="text-lg">{pts[p].d}</p>
      </div>
      <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
        <Lightbulb className="mr-2 inline h-4 w-4 text-gold" />
        Termômetro de espeto custa R$ 25 e evita 90% das reclamações. Melhor investimento inicial depois da churrasqueira.
      </div>
    </SlideShell>
  );
}

function StepsSlide() {
  const [step, setStep] = useState(0);
  const steps = [
    "Corte a carne em cubos uniformes de 3cm",
    "Tempere e deixe descansar por 4h",
    "Espete alternando com cebola e pimentão",
    "Deixe 1cm de espaço entre cada cubo",
    "Pincele azeite antes de ir pra brasa",
  ];
  return (
    <SlideShell chapter="Capítulo 9" title="Montagem profissional">
      <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-fire/10 to-transparent p-8">
        <div className="text-center">
          <div className="font-display text-6xl font-black text-fire">{step + 1}</div>
          <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">de {steps.length}</div>
        </div>
        <p className="mt-6 text-center text-xl">{steps[step]}</p>
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full bg-white/10 p-3 disabled:opacity-30"
          ><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-fire" : "w-2 bg-white/20"}`} />
            ))}
          </div>
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={step === steps.length - 1}
            className="rounded-full bg-fire p-3 disabled:opacity-30"
          ><ChevronRight className="h-5 w-5 text-white" /></button>
        </div>
      </div>
    </SlideShell>
  );
}

function CostCalcSlide() {
  const [carne, setCarne] = useState(50);
  const [temp, setTemp] = useState(0.3);
  const [pal, setPal] = useState(0.2);
  const [emb, setEmb] = useState(0.5);
  const total = carne / 20 + temp + pal + emb;
  return (
    <SlideShell chapter="Capítulo 10" title="Custo real por espetinho">
      <p className="text-muted-foreground">Ajuste os valores e veja seu custo em tempo real.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { l: "Carne por kg", v: carne, set: setCarne, min: 20, max: 100, step: 1, fmt: (n: number) => BRL(n) },
          { l: "Tempero por espeto", v: temp, set: setTemp, min: 0.1, max: 1, step: 0.05, fmt: (n: number) => BRL(n) },
          { l: "Palito por espeto", v: pal, set: setPal, min: 0.05, max: 0.5, step: 0.05, fmt: (n: number) => BRL(n) },
          { l: "Embalagem por espeto", v: emb, set: setEmb, min: 0.1, max: 1.5, step: 0.05, fmt: (n: number) => BRL(n) },
        ].map((it, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{it.l}</span>
              <span className="font-mono font-bold text-fire">{it.fmt(it.v)}</span>
            </div>
            <input type="range" min={it.min} max={it.max} step={it.step} value={it.v} onChange={(e) => it.set(Number(e.target.value))} className="mt-2 w-full accent-[oklch(0.63_0.24_27)]" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-fire/30 bg-gradient-to-r from-fire/20 to-gold/10 p-6 text-center">
        <div className="text-sm uppercase tracking-widest text-muted-foreground">Custo por espetinho</div>
        <div className="font-display text-5xl font-black text-fire">{BRL(total)}</div>
        <div className="mt-2 text-sm">Considerando 20 espetos por kg</div>
      </div>
    </SlideShell>
  );
}

function PriceSlide() {
  const custo = 3.2;
  const [mult, setMult] = useState(3);
  const preco = custo * mult;
  const lucro = preco - custo;
  return (
    <SlideShell chapter="Capítulo 11" title="Precificação que dá lucro de verdade">
      <p className="text-muted-foreground">Custo médio {BRL(custo)}. Ajuste o multiplicador:</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-center">
          <div className="font-display text-6xl font-black text-fire">{mult.toFixed(1)}x</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">multiplicador</div>
        </div>
        <input type="range" min={2} max={5} step={0.1} value={mult} onChange={(e) => setMult(Number(e.target.value))} className="mt-4 w-full accent-[oklch(0.63_0.24_27)]" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-muted-foreground">Custo</div>
          <div className="font-display text-2xl font-bold">{BRL(custo)}</div>
        </div>
        <div className="rounded-xl border border-fire/30 bg-fire/10 p-4">
          <div className="text-xs text-muted-foreground">Preço</div>
          <div className="font-display text-2xl font-bold text-fire">{BRL(preco)}</div>
        </div>
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
          <div className="text-xs text-muted-foreground">Lucro</div>
          <div className="font-display text-2xl font-bold text-gold">{BRL(lucro)}</div>
        </div>
      </div>
      {mult < 2.5 && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm"><AlertTriangle className="mr-2 inline h-4 w-4 text-red-400" />Margem apertada — qualquer imprevisto vira prejuízo.</div>}
      {mult >= 3 && <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm"><Trophy className="mr-2 inline h-4 w-4 text-gold" />Margem saudável — dá pra escalar com segurança.</div>}
    </SlideShell>
  );
}

function ComboSlide() {
  const combos = [
    { n: "Trio Bombou", i: "3 espetos + refri lata", p: "R$ 25", m: "+40% ticket médio" },
    { n: "Combo Casal", i: "6 espetos + 2 refris + pão", p: "R$ 55", m: "+65% ticket médio" },
    { n: "Festa em Casa", i: "20 espetos + acompanhamentos", p: "R$ 189", m: "+120% ticket médio" },
  ];
  return (
    <SlideShell chapter="Capítulo 12" title="Combos que fazem o cliente gastar mais">
      <div className="mt-6 space-y-3">
        {combos.map((c, i) => (
          <div key={i} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-fire/50 hover:bg-fire/5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fire to-gold font-display text-xl font-bold">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold">{c.n}</div>
              <div className="text-sm text-muted-foreground">{c.i}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold text-fire">{c.p}</div>
              <div className="text-xs text-gold">{c.m}</div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function DoDontSlide() {
  return (
    <SlideShell chapter="Capítulo 13" title="Evitar desperdícios que quebram o negócio">
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-gold">
            <ThumbsUp className="h-5 w-5" /> Faça
          </div>
          <ul className="space-y-2 text-sm">
            {["Congele o excedente porcionado", "Use as sobras em combos promocionais", "Anote todo desperdício por 15 dias", "Compre carne fresca 2x na semana"].map((it, i) => (
              <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-gold" />{it}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-red-400">
            <ThumbsDown className="h-5 w-5" /> Não faça
          </div>
          <ul className="space-y-2 text-sm">
            {["Comprar 30kg de carne pra semana inteira", "Temperar tudo de uma vez", "Deixar espeto pronto sem venda garantida", "Descongelar e recongelar (perigo real)"].map((it, i) => (
              <li key={i} className="flex gap-2"><X className="h-4 w-4 shrink-0 text-red-400" />{it}</li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}

function CarouselSlide() {
  const [i, setI] = useState(0);
  const tips = [
    { t: "Açougues do bairro", d: "Negocie preço fechando quantidade semanal fixa. 8-12% de desconto é normal." },
    { t: "Frigoríficos regionais", d: "Compre direto quando passar de 30kg/semana. Economia de até 25%." },
    { t: "CEASA / atacadistas", d: "Ideal pra legumes, cebola e pimentão. Preço 40% menor que supermercado." },
    { t: "Distribuidor de embalagens", d: "Nunca compre em papelaria. Pedidos acima de 500un cortam custo em 60%." },
  ];
  return (
    <SlideShell chapter="Capítulo 14" title="Onde encontrar os melhores fornecedores">
      <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-fire/10 to-transparent p-8 text-center">
        <div className="mb-3"><Pill tone="fire">Dica {i + 1} de {tips.length}</Pill></div>
        <div className="font-display text-2xl font-bold">{tips[i].t}</div>
        <p className="mt-4 text-muted-foreground">{tips[i].d}</p>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={() => setI((x) => (x - 1 + tips.length) % tips.length)} className="rounded-full bg-white/10 p-3 hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex gap-2">
          {tips.map((_, j) => (
            <button key={j} onClick={() => setI(j)} className={`h-2 rounded-full transition-all ${i === j ? "w-8 bg-fire" : "w-2 bg-white/20"}`} />
          ))}
        </div>
        <button onClick={() => setI((x) => (x + 1) % tips.length)} className="rounded-full bg-fire p-3 hover:bg-fire/80"><ChevronRight className="h-5 w-5 text-white" /></button>
      </div>
    </SlideShell>
  );
}

function ScriptSlide() {
  const [copied, setCopied] = useState<number | null>(null);
  const scripts = [
    { n: "Primeiro contato", t: "Oi [Nome]! Sou do Espetos [Marca] aqui do bairro. Hoje temos espetinho de alcatra a R$ 8 e combo com refri por R$ 25. Posso te reservar? 🔥" },
    { n: "Cliente sumido", t: "Fala [Nome]! Faz um tempinho que não passa aqui. Hoje tá saindo do forno, quer garantir a marmita? Faço entrega até 22h." },
    { n: "Combo festa", t: "Oi! Vi que tem festa marcada. Fecho pra você 20 espetos + acompanhamentos por R$ 189 e ainda entrego montadinho. Bora?" },
  ];
  return (
    <SlideShell chapter="Capítulo 15" title="WhatsApp que converte">
      <div className="mt-6 space-y-4">
        {scripts.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-fire">{s.n}</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(s.t); setCopied(i); setTimeout(() => setCopied(null), 1500); }}
                className="rounded-full bg-fire/20 px-3 py-1 text-xs text-fire hover:bg-fire/30"
              >{copied === i ? "Copiado!" : "Copiar"}</button>
            </div>
            <div className="rounded-xl bg-green-950/30 p-3 text-sm text-green-100">
              <MessageCircle className="mr-2 inline h-4 w-4 text-green-400" />
              {s.t}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function InstagramSlide() {
  return (
    <SlideShell chapter="Capítulo 16" title="Instagram que atrai clientes">
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { d: "Segunda", t: "Foto do preparo — bastidor", i: Camera },
          { d: "Terça", t: "Cardápio da semana", i: Grid3x3 },
          { d: "Quarta", t: "Vídeo cortando carne", i: Play },
          { d: "Quinta", t: "Depoimento de cliente", i: MessageCircle },
          { d: "Sexta", t: "Combo da sexta em destaque", i: Flame },
          { d: "Sábado", t: "Story ao vivo na brasa", i: Instagram },
          { d: "Domingo", t: "Foto do prato pronto", i: Camera },
        ].map((d, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:scale-105 hover:border-fire/40">
            <d.i className="h-5 w-5 text-fire" />
            <div className="mt-2 text-xs uppercase tracking-widest text-gold">{d.d}</div>
            <div className="mt-1 text-sm font-semibold">{d.t}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
        <Lightbulb className="mr-2 inline h-4 w-4 text-gold" />
        Poste no mesmo horário todo dia. O algoritmo recompensa consistência.
      </div>
    </SlideShell>
  );
}

function PhotoSlide() {
  const rules = [
    "Luz natural, sempre. Nunca flash direto.",
    "Ângulo de 45° realça o volume do espeto.",
    "Fundo de madeira ou pedra — nunca plástico.",
    "Fumaça saindo é o gatilho visual mais forte.",
    "Cliente comendo com sorriso vende mais que qualquer foto.",
  ];
  return (
    <SlideShell chapter="Capítulo 17" title="Fotos que dão água na boca">
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl">
          <img src={IMG.platter1} alt="Espetinhos" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4"><Pill tone="fire">Referência visual</Pill></div>
        </div>
        <ol className="space-y-2">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fire/20 font-display text-sm font-bold text-fire">{i + 1}</div>
              <span className="text-sm">{r}</span>
            </li>
          ))}
        </ol>
      </div>
    </SlideShell>
  );
}

function LoyaltySlide() {
  return (
    <SlideShell chapter="Capítulo 18" title="Fidelização — cliente que volta 3x já é seu">
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { i: Heart, t: "Cartão fidelidade", d: "10 espetos = 1 grátis. Simples e funciona." },
          { i: Star, t: "Bônus surpresa", d: "Um vinagrete a mais no pedido acima de R$ 40." },
          { i: Users, t: "Indique e ganhe", d: "R$ 10 de desconto pra quem trouxer amigo." },
          { i: Award, t: "Nome na embalagem", d: "Escreva o nome do cliente. Toque humano vale ouro." },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:scale-105 hover:border-fire/40">
            <c.i className="h-8 w-8 text-fire" />
            <div className="mt-3 font-display text-lg font-bold">{c.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function GrowthSlide() {
  const stages = [
    { r: "R$ 500-2k/mês", d: "Fase renda extra — fim de semana e feriados." },
    { r: "R$ 2k-5k/mês", d: "Ponto fixo em eventos + delivery próprio." },
    { r: "R$ 5k-10k/mês", d: "Contratar 1 ajudante, expandir cardápio." },
    { r: "R$ 10k+/mês", d: "Loja física, equipe e produto próprio." },
  ];
  return (
    <SlideShell chapter="Capítulo 19" title="Da renda extra ao negócio de verdade">
      <div className="mt-6 space-y-3">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-display text-3xl font-black text-fire">{i + 1}</div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold text-gold">{s.r}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
            <TrendingUp className="h-6 w-6 text-fire" />
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function QuizSlide() {
  const questions = [
    { q: "Qual o multiplicador ideal de preço sobre o custo?", opts: ["1.5x", "3x", "10x"], correct: 1 },
    { q: "Quanto tempo mínimo de descanso do tempero?", opts: ["30 minutos", "4 horas", "3 dias"], correct: 1 },
    { q: "Onde comprar embalagens com melhor custo?", opts: ["Papelaria", "Supermercado", "Distribuidor"], correct: 2 },
  ];
  const [answers, setAnswers] = useState<number[]>([]);
  const score = answers.filter((a, i) => a === questions[i]?.correct).length;
  const done = answers.length === questions.length;
  return (
    <SlideShell chapter="Interatividade" title="Quiz rápido — fixa o aprendizado">
      <div className="mt-4 space-y-5">
        {questions.map((q, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-semibold">{i + 1}. {q.q}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.opts.map((o, j) => {
                const chosen = answers[i] === j;
                const wasAnswered = answers[i] !== undefined;
                const isCorrect = j === q.correct;
                return (
                  <button
                    key={j}
                    onClick={() => setAnswers((a) => { const n = [...a]; n[i] = j; return n; })}
                    className={`rounded-full border px-4 py-2 text-sm transition ${chosen && wasAnswered ? (isCorrect ? "border-gold bg-gold/20 text-gold" : "border-red-500 bg-red-500/20 text-red-400") : "border-white/15 hover:border-fire/40"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {done && (
        <div className="animate-fade-in mt-6 rounded-2xl border border-fire/30 bg-gradient-to-r from-fire/20 to-gold/10 p-6 text-center">
          <Trophy className="mx-auto h-10 w-10 text-gold" />
          <div className="mt-2 font-display text-3xl font-bold">{score} / {questions.length}</div>
          <div className="text-sm text-muted-foreground">
            {score === questions.length ? "Perfeito! Você tá pronto pra vender." : "Boa! Revise os capítulos e volta forte."}
          </div>
          <button onClick={() => setAnswers([])} className="mt-4 inline-flex items-center gap-2 rounded-full bg-fire px-4 py-2 text-sm font-bold">
            <RefreshCw className="h-4 w-4" /> Refazer
          </button>
        </div>
      )}
    </SlideShell>
  );
}

function PlanSlide() {
  const [open, setOpen] = useState(0);
  const weeks = [
    { s: "Semana 1", t: "Fundamentos", tasks: ["Definir seu público", "Comprar equipamentos essenciais", "Testar 3 receitas base"] },
    { s: "Semana 2", t: "Primeiros clientes", tasks: ["Divulgar no WhatsApp pessoal", "Criar Instagram do negócio", "Vender pra 10 conhecidos"] },
    { s: "Semana 3", t: "Ajustes", tasks: ["Refinar tempero pelo feedback", "Testar combos", "Fotografar cardápio"] },
    { s: "Semana 4", t: "Escala", tasks: ["Rodar 2 dias de venda fixa", "Fechar 1º evento", "Reinvestir 100% do lucro"] },
  ];
  return (
    <SlideShell chapter="Capítulo 20" title="Plano de ação — seus próximos 30 dias">
      <div className="mt-4 space-y-3">
        {weeks.map((w, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-white/[0.03]">
              <Calendar className="h-5 w-5 text-fire" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-gold">{w.s}</div>
                <div className="font-display text-lg font-bold">{w.t}</div>
              </div>
              <ChevronRight className={`h-5 w-5 transition ${open === i ? "rotate-90" : ""}`} />
            </button>
            {open === i && (
              <div className="animate-fade-in border-t border-white/10 p-4">
                <ul className="space-y-2">
                  {w.tasks.map((t, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm"><Circle className="h-3 w-3 text-fire" />{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function ErrorsSlide() {
  const errors = [
    "Preço abaixo do custo pra atrair cliente",
    "Comprar equipamento caro no primeiro mês",
    "Não anotar o que vende e o que sobra",
    "Misturar dinheiro pessoal com o do negócio",
    "Dar desconto sem estratégia",
    "Postar só quando dá vontade",
  ];
  return (
    <SlideShell chapter="Capítulo Extra" title="Erros que fazem perder dinheiro">
      <p className="text-muted-foreground">Cada um desses erros já quebrou espetinho. Marque quais você já cometeu:</p>
      <ChecklistCore items={errors} />
    </SlideShell>
  );
}

function ChecklistCore({ items }: { items: string[] }) {
  const [d, setD] = useState<number[]>([]);
  return (
    <div className="mt-4 space-y-2">
      {items.map((it, i) => {
        const on = d.includes(i);
        return (
          <button
            key={i}
            onClick={() => setD((x) => on ? x.filter((y) => y !== i) : [...x, i])}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${on ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-white/10 bg-white/[0.02] hover:border-red-500/30"}`}
          >
            <div className={`h-5 w-5 rounded border ${on ? "border-red-400 bg-red-500" : "border-white/20"}`}>
              {on && <X className="h-5 w-5 text-white" />}
            </div>
            {it}
          </button>
        );
      })}
    </div>
  );
}

function GoalsSlide() {
  const [meta, setMeta] = useState(5000);
  const espetos = Math.ceil(meta / 8);
  const dias = Math.ceil(espetos / 50);
  return (
    <SlideShell chapter="Sua meta" title="Onde você quer chegar?">
      <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-fire/10 to-gold/5 p-8 text-center">
        <Target className="mx-auto h-10 w-10 text-fire" />
        <div className="mt-3 text-sm uppercase tracking-widest text-muted-foreground">Minha meta mensal</div>
        <div className="mt-2 font-display text-6xl font-black text-fire">{BRL(meta)}</div>
        <input type="range" min={1000} max={15000} step={500} value={meta} onChange={(e) => setMeta(Number(e.target.value))} className="mt-6 w-full accent-[oklch(0.63_0.24_27)]" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-muted-foreground">Espetinhos por mês</div>
          <div className="font-display text-3xl font-bold text-gold">{espetos.toLocaleString("pt-BR")}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-muted-foreground">Dias trabalhando</div>
          <div className="font-display text-3xl font-bold text-fire">{dias} dias</div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Considerando ticket médio de R$ 8 e 50 espetos por dia.
      </p>
    </SlideShell>
  );
}

function CongratsSlide() {
  return (
    <SlideShell cover>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fire/20 via-black to-gold/10 p-12">
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-fire/30 blur-3xl" />
        <PartyPopper className="mx-auto h-16 w-16 text-gold" />
        <h1 className="mt-6 font-display text-5xl font-black">Você chegou ao final!</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Agora é execução. Volta nesse ebook sempre que bater dúvida. O próximo passo é abrir o cardápio de cursos e ir mais fundo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/app/cursos" className="btn-fire text-sm">
            <Rocket className="h-4 w-4" /> Ver cursos completos
          </Link>
          <Link to="/app" className="btn-ghost-fire text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>
      </div>
    </SlideShell>
  );
}

/* ---------------------------- reader shell ---------------------------- */

const SLIDES: Array<{ label: string; render: (jump: (i: number) => void) => React.ReactNode }> = [
  { label: "Capa", render: () => <CoverSlide /> },
  { label: "Promessa", render: () => <PromiseSlide /> },
  { label: "Sumário", render: (j) => <TocSlide jump={j} /> },
  { label: "Mentalidade", render: () => <MindsetSlide /> },
  { label: "Orçamento", render: () => <InvestmentSlide /> },
  { label: "Equipamentos", render: () => <ChecklistSlide chapter="Capítulo 3" title="Equipamentos essenciais" subtitle="Marque o que já tem. O resto entra na lista de compras." items={[
    "Churrasqueira de tambor ou grelha", "Espetos de inox (mínimo 50un)", "Faca profissional 8 polegadas",
    "Tábua grande de polietileno", "Isopor grande com gelo", "Balança digital de precisão",
    "Luvas de proteção térmica", "Pincel de silicone pro azeite",
  ]} /> },
  { label: "Carnes", render: () => <FlipCardsSlide /> },
  { label: "Cortes", render: () => <TabsSlide /> },
  { label: "Tempero", render: () => <RevealSlide /> },
  { label: "Brasa", render: () => <TimelineSlide /> },
  { label: "Ponto", render: () => <PointPickerSlide /> },
  { label: "Montagem", render: () => <StepsSlide /> },
  { label: "Custo", render: () => <CostCalcSlide /> },
  { label: "Preço", render: () => <PriceSlide /> },
  { label: "Combos", render: () => <ComboSlide /> },
  { label: "Desperdício", render: () => <DoDontSlide /> },
  { label: "Fornecedores", render: () => <CarouselSlide /> },
  { label: "Higiene", render: () => <ChecklistSlide chapter="Capítulo 15" title="Higiene e segurança alimentar" subtitle="Uma reclamação de intoxicação apaga anos de reputação." items={[
    "Carne sempre entre 0°C e 4°C", "Descongelamento só na geladeira", "Tábua separada pra crua e cozida",
    "Higienização das mãos a cada 30min", "Sem panos de prato — só papel toalha", "Água quente e sabão neutro pós-uso",
  ]} /> },
  { label: "WhatsApp", render: () => <ScriptSlide /> },
  { label: "Instagram", render: () => <InstagramSlide /> },
  { label: "Fotos", render: () => <PhotoSlide /> },
  { label: "Fidelização", render: () => <LoyaltySlide /> },
  { label: "Crescimento", render: () => <GrowthSlide /> },
  { label: "Quiz", render: () => <QuizSlide /> },
  { label: "Plano 30 dias", render: () => <PlanSlide /> },
  { label: "Erros", render: () => <ErrorsSlide /> },
  { label: "Metas", render: () => <GoalsSlide /> },
  { label: "Bônus", render: () => <SlideShell chapter="Bônus" title="Regras de ouro do Ronnei">
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {[
        { i: ShieldCheck, t: "Nunca sirva o que você não comeria" },
        { i: Coins, t: "Reinveste 50% do lucro nos primeiros 6 meses" },
        { i: Users, t: "Trate cada cliente como se fosse o único" },
        { i: Flame, t: "Consistência bate talento — todo dia na brasa" },
        { i: ListChecks, t: "Anota tudo, decide com número" },
        { i: Rocket, t: "Se der medo, é sinal que tá crescendo" },
      ].map((c, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/5 p-4 transition hover:scale-105 hover:border-gold/50">
          <c.i className="h-6 w-6 text-gold" />
          <span className="text-sm font-semibold">{c.t}</span>
        </div>
      ))}
    </div>
  </SlideShell> },
  { label: "Parabéns", render: () => <CongratsSlide /> },
];

function PremiumReader() {
  const [i, setI] = useState(0);
  const [toc, setToc] = useState(false);
  const total = SLIDES.length;
  const pct = ((i + 1) / total) * 100;

  const go = (n: number) => setI(Math.max(0, Math.min(total - 1, n)));
  const jump = (n: number) => { go(n); setToc(false); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "Escape") setToc(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const el = document.getElementById("premium-slide");
      el?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [i]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-black via-charcoal to-black">
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur">
        <Link to="/app/ebooks" className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
          <ArrowLeft className="h-3.5 w-3.5" /> Sair
        </Link>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-fire" />
          <span className="hidden font-display text-sm font-bold sm:inline">Do Zero aos 10k</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setToc((v) => !v)} className="rounded-full bg-white/5 p-2 hover:bg-white/10" aria-label="Sumário">
            <Grid3x3 className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-mono">
            {i + 1} / {total}
          </span>
        </div>
      </div>

      {/* progress */}
      <div className="h-1 w-full bg-white/5">
        <div className="h-full bg-gradient-to-r from-fire via-gold to-fire transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* content */}
      <div id="premium-slide" className="relative flex-1 overflow-y-auto" key={i}>
        {SLIDES[i].render(jump)}
      </div>

      {/* bottom nav */}
      <div className="flex items-center gap-3 border-t border-white/10 bg-black/60 p-3 backdrop-blur">
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Anterior</span>
        </button>
        <div className="hidden flex-1 items-center gap-1 overflow-hidden sm:flex">
          {SLIDES.map((_, j) => (
            <button
              key={j}
              onClick={() => go(j)}
              className={`h-1.5 flex-1 rounded-full transition-all ${j === i ? "bg-fire" : j < i ? "bg-fire/40" : "bg-white/10"}`}
              aria-label={`Ir para slide ${j + 1}`}
            />
          ))}
        </div>
        <div className="flex-1 sm:hidden text-center text-xs text-muted-foreground">
          {SLIDES[i].label}
        </div>
        <button
          onClick={() => go(i + 1)}
          disabled={i === total - 1}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fire to-gold px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-30"
        >
          <span className="hidden sm:inline">Próxima</span> <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* toc drawer */}
      {toc && (
        <div className="animate-fade-in absolute inset-0 z-10 flex items-start justify-end bg-black/70 backdrop-blur-sm" onClick={() => setToc(false)}>
          <div className="animate-slide-in-right h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-charcoal p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Todas as páginas</h2>
              <button onClick={() => setToc(false)} className="rounded-full bg-white/5 p-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1">
              {SLIDES.map((s, j) => (
                <button
                  key={j}
                  onClick={() => jump(j)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${j === i ? "bg-fire/20 text-fire" : "hover:bg-white/5"}`}
                >
                  <span className="w-8 font-mono text-xs text-muted-foreground">{String(j + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{s.label}</span>
                  {j === i && <Play className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

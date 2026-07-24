import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Flame, Grid3x3, Lightbulb, ListChecks,
  MessageCircle, Play, Quote, Sparkles, X, Rocket, Store, Check as CheckIcon,
} from "lucide-react";
import type { Ebook, EbookSlide } from "@/lib/ebook-ai.functions";
import { addToLibrary, isInLibrary, type LibraryEbook } from "@/lib/ebook-library";

export const Route = createFileRoute("/app/ebooks/gerado/$id")({
  head: () => ({ meta: [{ title: "Ebook gerado por IA — Espetinho na Veia" }] }),
  component: GeneratedEbookReader,
});

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
  chapter, title, children, cover,
}: {
  chapter?: string; title?: string; children: React.ReactNode; cover?: boolean;
}) {
  return (
    <div className={`animate-fade-in mx-auto flex h-full w-full max-w-5xl flex-col ${cover ? "justify-center text-center" : "justify-start"} p-6 sm:p-10`}>
      {chapter && !cover && (
        <div className="mb-3"><Pill tone="gold"><Sparkles className="h-3 w-3" />{chapter}</Pill></div>
      )}
      {title && !cover && (
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{title}</h1>
      )}
      <div className={`${cover ? "" : "mt-6"} flex-1`}>{children}</div>
    </div>
  );
}

function renderSlide(s: EbookSlide, ebook: Ebook, i: number, total: number) {
  switch (s.type) {
    case "cover":
      return (
        <SlideShell cover>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-charcoal/60 to-fire/20 p-10 sm:p-16">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fire/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative">
              <Pill tone="fire"><Flame className="h-3 w-3" />{s.badge || "Ebook · Gerado por IA"}</Pill>
              <h1 className="mt-6 font-display text-4xl font-black leading-[0.95] sm:text-6xl">{s.title}</h1>
              {s.subtitle && (
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{s.subtitle}</p>
              )}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Pill tone="muted"><BookOpen className="h-3 w-3" />{total} páginas</Pill>
                <Pill tone="muted"><Sparkles className="h-3 w-3" />Interativo</Pill>
              </div>
            </div>
          </div>
        </SlideShell>
      );
    case "chapter":
      return (
        <SlideShell cover>
          <div className="rounded-3xl border border-white/10 bg-charcoal/40 p-10 sm:p-14">
            <Pill tone="gold">{s.chapter}</Pill>
            <h1 className="mt-6 font-display text-4xl font-black sm:text-5xl">{s.title}</h1>
            {s.intro && <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{s.intro}</p>}
          </div>
        </SlideShell>
      );
    case "content":
      return (
        <SlideShell chapter={s.chapter} title={s.title}>
          {s.body && <p className="text-lg leading-relaxed text-muted-foreground">{s.body}</p>}
          {s.bullets && s.bullets.length > 0 && (
            <ul className="mt-6 space-y-3">
              {s.bullets.map((b, k) => (
                <li key={k} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-fire" />
                  <span className="text-sm sm:text-base">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </SlideShell>
      );
    case "checklist":
      return (
        <SlideShell chapter={s.chapter} title={s.title}>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <ListChecks className="h-4 w-4" /> Checklist prático
            </div>
            <ul className="space-y-2">
              {s.items.map((it, k) => (
                <li key={k} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-fire/20 text-xs font-bold text-fire">{k + 1}</div>
                  <span className="text-sm sm:text-base">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </SlideShell>
      );
    case "tip":
      return (
        <SlideShell chapter={s.chapter} title={s.title}>
          <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/10 to-fire/10 p-8 sm:p-12">
            <Lightbulb className="absolute right-6 top-6 h-16 w-16 text-gold/40" />
            <Pill tone="gold"><Lightbulb className="h-3 w-3" />Dica de ouro</Pill>
            <p className="mt-6 font-display text-2xl leading-snug sm:text-3xl">{s.tip}</p>
          </div>
        </SlideShell>
      );
    case "quote":
      return (
        <SlideShell cover>
          <div className="mx-auto max-w-3xl">
            <Quote className="mx-auto h-12 w-12 text-fire" />
            <blockquote className="mt-6 font-display text-3xl font-bold leading-snug sm:text-4xl">
              “{s.quote}”
            </blockquote>
            {s.author && <div className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">— {s.author}</div>}
          </div>
        </SlideShell>
      );
    case "cta":
      return (
        <SlideShell cover>
          <div className="rounded-3xl border border-fire/30 bg-gradient-to-br from-fire/20 to-gold/10 p-10 sm:p-14">
            <Pill tone="fire"><Rocket className="h-3 w-3" />Próximo passo</Pill>
            <h1 className="mt-6 font-display text-4xl font-black sm:text-5xl">{s.title}</h1>
            {s.body && <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{s.body}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/app" className="btn-fire text-sm"><MessageCircle className="h-4 w-4" />{s.button || "Voltar para a plataforma"}</Link>
            </div>
          </div>
        </SlideShell>
      );
  }
}

function GeneratedEbookReader() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [i, setI] = useState(0);
  const [toc, setToc] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`eiv:ebook:${id}`);
      if (!raw) { setNotFound(true); return; }
      setEbook(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
  }, [id]);

  const total = ebook?.slides.length ?? 0;
  const go = (n: number) => setI(Math.max(0, Math.min(total - 1, n)));
  const jump = (n: number) => { go(n); setToc(false); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, total]);

  const current = useMemo(() => ebook?.slides[i], [ebook, i]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl font-bold">Ebook não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">O ebook foi removido ou está em outro navegador (salvamos localmente enquanto a API oficial não é integrada).</p>
          <button onClick={() => navigate({ to: "/app/admin/ebook-ai" })} className="btn-fire mt-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar ao gerador
          </button>
        </div>
      </div>
    );
  }

  if (!ebook || !current) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-charcoal">
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/60 p-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/app/admin/ebook-ai" })} className="rounded-full bg-white/5 p-2 hover:bg-white/10" aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{ebook.title}</div>
          <div className="text-[11px] text-muted-foreground">Slide {i + 1} de {total}</div>
        </div>
        <button onClick={() => setToc(true)} className="rounded-full bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
          <Grid3x3 className="mr-1 inline h-3.5 w-3.5" /> Sumário
        </button>
      </div>

      {/* slide */}
      <div className="relative flex-1 overflow-y-auto" key={i}>
        {renderSlide(current, ebook, i, total)}
      </div>

      {/* bottom nav */}
      <div className="flex items-center gap-3 border-t border-white/10 bg-black/60 p-3 backdrop-blur">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Anterior</span>
        </button>
        <div className="hidden flex-1 items-center gap-1 overflow-hidden sm:flex">
          {ebook.slides.map((_, j) => (
            <button key={j} onClick={() => go(j)} className={`h-1.5 flex-1 rounded-full transition-all ${j === i ? "bg-fire" : j < i ? "bg-fire/40" : "bg-white/10"}`} aria-label={`Ir para slide ${j + 1}`} />
          ))}
        </div>
        <button onClick={() => go(i + 1)} disabled={i === total - 1} className="flex items-center gap-2 rounded-full bg-[#ff6a00] px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:brightness-110 disabled:opacity-30">
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
              {ebook.slides.map((s, j) => {
                const label =
                  s.type === "cover" ? "Capa" :
                  s.type === "cta" ? "Encerramento" :
                  "label" in s ? s.label : "Slide";
                return (
                  <button key={j} onClick={() => jump(j)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${j === i ? "bg-fire/20 text-fire" : "hover:bg-white/5"}`}>
                    <span className="w-8 font-mono text-xs text-muted-foreground">{String(j + 1).padStart(2, "0")}</span>
                    <span className="flex-1 truncate">{label}</span>
                    {j === i && <Play className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

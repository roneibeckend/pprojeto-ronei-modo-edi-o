import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { FAQ, FAQ_CATEGORIES, type FaqItem } from "@/lib/faq-knowledge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/suporte-ia")({
  head: () => ({
    meta: [
      { title: "Suporte Instantâneo IA — Fidelize" },
      {
        name: "description",
        content:
          "Tire suas dúvidas com a Bruna, assistente inteligente da Fidelize. Respostas instantâneas 24 horas por dia sobre QR Code, campanhas, fidelidade e mais.",
      },
      { property: "og:title", content: "Suporte Instantâneo IA — Fidelize" },
      {
        property: "og:description",
        content: "Assistente virtual 24/7 com respostas instantâneas sobre a plataforma Fidelize.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuporteIA,
});

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

const QUICK_SUGGESTIONS = [
  "Como funciona o QR Code?",
  "Posso testar grátis?",
  "Como recompenso meus clientes?",
  "Como funciona a Árvore de Links?",
  "Como imprimir meu Display?",
  "Quero cadastrar clientes.",
  "Quero falar com um atendente.",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! 👋 Sou a **Bruna**, assistente inteligente da Fidelize. Estou pronta para tirar suas dúvidas sobre o sistema. Você pode conversar comigo normalmente ou escolher uma das perguntas abaixo.",
  ts: Date.now(),
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Minimal markdown → HTML (bold, italic, code, line breaks, lists)
function renderMd(src: string): string {
  const esc = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let html = esc
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // numbered lists
  html = html.replace(/(?:^|\n)((?:\d+\.\s.+(?:\n|$))+)/g, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^\d+\.\s/, ""))
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `<ol class="my-2 ml-5 list-decimal space-y-1">${items}</ol>`;
  });
  html = html.replace(/\n/g, "<br />");
  return html;
}

function SuporteIA() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.filter((f) => {
      const inCat = activeCategory === "Todas" || f.category === activeCategory;
      const inSearch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [query, activeCategory]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-white/5 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">
              Suporte disponível <strong className="text-foreground">24/7</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Suporte Instantâneo · IA
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dúvidas frequentes
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Clique numa dúvida ou converse com a{" "}
            <strong className="text-foreground">Bruna</strong>, nossa assistente
            inteligente.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* LEFT — FAQ */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Perguntas mais comuns
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Toque numa pergunta para ver a resposta.
            </p>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar dúvida..."
                className="h-11 w-full rounded-xl border border-white/10 bg-background/60 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-white/20"
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {["Todas", ...FAQ_CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    activeCategory === c
                      ? "border-white/30 bg-white/10 text-foreground"
                      : "border-white/10 bg-transparent text-muted-foreground hover:border-white/20 hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <ul className="space-y-2">
              {filtered.map((f) => (
                <FaqRow
                  key={f.id}
                  item={f}
                  open={openFaq === f.id}
                  onToggle={() =>
                    setOpenFaq((cur) => (cur === f.id ? null : f.id))
                  }
                />
              ))}
              {filtered.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                  Nenhuma pergunta encontrada. Pergunte à Bruna ao lado.
                </li>
              )}
            </ul>
          </section>

          {/* RIGHT — chat */}
          <BrunaChat />
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
          Powered by IA · As respostas podem conter pequenas imprecisões.
        </p>
      </div>
    </main>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left text-sm transition",
          open
            ? "border-white/20 bg-white/[0.04]"
            : "border-white/10 bg-transparent hover:border-white/20 hover:bg-white/[0.02]",
        )}
      >
        <span className="flex items-center gap-2">
          {item.featured && (
            <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          )}
          <span className="font-medium">{item.question}</span>
        </span>
        <span
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs transition",
            open && "rotate-45 bg-white/10",
          )}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </div>
        </div>
      </div>
    </li>
  );
}

function BrunaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || status === "streaming") return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      ts: Date.now(),
    };
    const assistantId = uid();
    const placeholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      ts: Date.now(),
    };

    const history = [...messages, userMsg];
    setMessages([...history, placeholder]);
    setInput("");
    setStatus("streaming");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/bruna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          messages: history
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        if (res.status === 429) throw new Error("Muitas solicitações. Aguarde alguns segundos.");
        if (res.status === 402) throw new Error("Créditos de IA esgotados. Entre em contato com o admin.");
        throw new Error("Não consegui responder agora. Tente de novo em instantes.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${msg}` }
            : m,
        ),
      );
      toast.error(msg);
    } finally {
      setStatus("idle");
      abortRef.current = null;
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <section className="flex h-[640px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02]">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/20 px-5 py-4">
        <div className="relative">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-lg">
            <Bot className="h-5 w-5" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Bruna IA
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Assistente
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Online agora
          </div>
        </div>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            m={m}
            streaming={
              status === "streaming" &&
              m.role === "assistant" &&
              i === messages.length - 1
            }
          />
        ))}

        {messages.length <= 1 && (
          <div className="pt-2">
            <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/90 transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-white/10 bg-black/20 p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-background/60 p-2 focus-within:border-white/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Pergunte qualquer coisa..."
            disabled={status === "streaming"}
            className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || status === "streaming"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-lg transition hover:brightness-110 disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

function MessageBubble({ m, streaming }: { m: ChatMessage; streaming: boolean }) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopied(true);
      toast.success("Resposta copiada");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  if (m.role === "user") {
    return (
      <div className="flex items-start justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-fuchsia-500/90 to-indigo-500/90 px-4 py-2.5 text-sm text-white shadow-md">
          {m.content}
        </div>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const showEmpty = streaming && !m.content;
  return (
    <div className="flex items-start gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] space-y-1.5">
        <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-relaxed text-foreground/95">
          {showEmpty ? (
            <TypingDots />
          ) : (
            <div
              className="prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
            />
          )}
        </div>

        {m.id !== "welcome" && !showEmpty && !streaming && (
          <div className="flex items-center gap-1 pl-1">
            <IconBtn onClick={copy} label="Copiar">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </IconBtn>
            <IconBtn
              onClick={() => {
                setFeedback("up");
                toast.success("Obrigada pelo feedback!");
              }}
              label="Útil"
              active={feedback === "up"}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              onClick={() => {
                setFeedback("down");
                toast("Vou melhorar nas próximas respostas.");
              }}
              label="Não útil"
              active={feedback === "down"}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/5 hover:text-foreground",
        active && "bg-white/10 text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </span>
  );
}

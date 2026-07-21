import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type JSX } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Flame,
  Check,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  Lock,
  Award,
  TrendingUp,
  Users,
  ChefHat,
  DollarSign,
  Calculator,
  ClipboardList,
  Truck,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Instagram,
  MessageCircle,
  Mail,
  Beef,
  Utensils,
  Target,
  Heart,
  Loader2,
  CheckCircle2,
  User,
  Phone,
  X,
} from "lucide-react";

import heroChef from "@/assets/hero-chef.asset.json";
import platter1 from "@/assets/platter1.asset.json";
import platter2 from "@/assets/platter2.asset.json";
import skewerSingle from "@/assets/skewer-single.asset.json";
import skewersHeld from "@/assets/skewers-held.asset.json";
import skewersFlat from "@/assets/skewers-flat.asset.json";
import ribeye from "@/assets/ribeye.asset.json";
import chefWorking from "@/assets/chef-working.asset.json";
import chefPortrait from "@/assets/chef-portrait.asset.json";
import author from "@/assets/author.asset.json";
import printWhats1 from "@/assets/print-whats-1.jpg";
import printWhats2 from "@/assets/print-whats-2.jpg";
import printWhats3 from "@/assets/print-whats-3.jpg";
import printPix from "@/assets/print-pix.jpg";

const SITE_URL = "https://sizzling-story-maker.lovable.app";
const OG_IMAGE = `${SITE_URL}${heroChef.url}`;

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Espetinho na Veia — Do Zero aos 10k | eBook Ronnei" },
      {
        name: "description",
        content:
          "eBook prático com 14 capítulos + bônus para montar, temperar, precificar e vender espetinhos com alto lucro. Comece do zero e chegue aos 10k/mês.",
      },
      { name: "keywords", content: "espetinho, ebook espetinho, como vender espetinho, negócio de espetinho, churrasco, renda extra, Ronnei" },
      { name: "author", content: "Ronnei" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:title", content: "Espetinho na Veia — Do Zero aos 10k" },
      {
        property: "og:description",
        content:
          "Método completo para lucrar vendendo espetinhos: carnes, temperos, brasa, precificação e vendas. 14 capítulos + bônus exclusivos.",
      },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Chef especialista em espetinhos com espetos flamejantes" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Espetinho na Veia" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Espetinho na Veia — Do Zero aos 10k" },
      {
        name: "twitter:description",
        content:
          "eBook prático para montar, temperar, precificar e vender espetinhos com alto lucro. Do zero aos 10k por mês.",
      },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: "Chef especialista em espetinhos" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Espetinho na Veia — Do Zero aos 10k",
          description:
            "eBook com 14 capítulos + bônus para montar, temperar, precificar e vender espetinhos com alto lucro.",
          image: [OG_IMAGE],
          brand: { "@type": "Brand", name: "Espetinho na Veia" },
          author: { "@type": "Person", name: "Ronnei" },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/#oferta`,
            price: "47.90",
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "2000",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Preciso ter experiência com churrasco para começar?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Não. O eBook foi feito para iniciantes: passo a passo do zero, escolha da carne, tempero, brasa e ponto certo.",
              },
            },
            {
              "@type": "Question",
              name: "Como recebo o eBook após a compra?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "O acesso é imediato por e-mail após a confirmação do pagamento, em PDF para ler no celular ou computador.",
              },
            },
            {
              "@type": "Question",
              name: "Existe garantia?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor.",
              },
            },
          ],
        }),
      },
    ],
  }),
});

// ---- Small primitives ----

type RevealVariant = "up" | "down" | "left" | "right" | "scale" | "blur" | "rotate" | "clip" | "tilt";

function Reveal({
  children,
  delay = 0,
  variant = "up",
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  variant?: RevealVariant;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.visible = "true";
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  const props: Record<string, unknown> = {
    ref: ref as React.Ref<HTMLElement>,
    className,
    "data-reveal": variant,
  };
  if (delay) props["data-reveal-delay"] = String(delay);
  return <Tag {...(props as Record<string, unknown>)}>{children}</Tag>;
}

function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (scrolled / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="h-full bg-fire shadow-fire transition-[width] duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Embers() {
  // Deterministic layout — no hydration mismatch
  const embers = Array.from({ length: 14 }, (_, i) => ({
    left: (i * 7.3) % 100,
    delay: (i * 0.31) % 4,
    dur: 3.2 + ((i * 0.7) % 2.5),
    size: 4 + (i % 4),
  }));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-64 overflow-hidden">
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function BrasaTicker() {
  const items = [
    "Do zero aos 10k",
    "Margens de até 300%",
    "Método na prática",
    "Brasa perfeita",
    "Tempero exclusivo",
    "Fornecedores certos",
    "Sem enrolação",
    "Feito por quem vive da grelha",
  ];
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[color:var(--gold)]/20 bg-gradient-to-r from-[color:var(--ember)]/10 via-transparent to-[color:var(--gold)]/10 py-4">
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <Flame className="h-4 w-4 shrink-0 text-[color:var(--gold)]" />
            <span className="text-foreground/90">{t}</span>
            <span className="text-[color:var(--gold)]/60">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]">
      <Flame className="h-3 w-3 animate-flicker sm:h-3.5 sm:w-3.5" />
      {children}
    </span>
  );
}

function CTAButton({
  children,
  size = "lg",
  className = "",
}: {
  children: React.ReactNode;
  size?: "lg" | "xl";
  className?: string;
}) {
  return (
    <a
      href="#oferta"
      className={`btn-fire shine-on-hover w-full sm:w-auto ${size === "xl" ? "text-base sm:text-lg sm:!px-10 sm:!py-5" : ""} ${className}`}
    >
      {children}
    </a>
  );
}

// Configuração do checkout — troque pela URL do Kiwify/Hotmart/Stripe quando disponível.
const CHECKOUT_URL = "";

function CheckoutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Simula pequena latência antes de redirecionar (evita clique duplo e mostra feedback).
      await new Promise((r) => setTimeout(r, 600));
      if (!CHECKOUT_URL) {
        throw new Error("URL de checkout ainda não configurada.");
      }
      window.location.href = CHECKOUT_URL;
    } catch (err) {
      console.error("[checkout] falha ao redirecionar:", err);
      toast.error("Não conseguimos abrir o checkout", {
        description:
          err instanceof Error ? err.message : "Verifique sua conexão e tente novamente.",
        action: { label: "Tentar de novo", onClick: () => handleClick() },
      });
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      className={`btn-fire shine-on-hover !text-lg !px-10 !py-5 w-full max-w-md disabled:opacity-80 disabled:cursor-wait ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Processando...
        </>
      ) : (
        <>
          Quero garantir meu acesso <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Digite seu nome completo")
    .max(80, "Nome muito longo"),
  whatsapp: z
    .string()
    .trim()
    .min(10, "WhatsApp com DDD (mín. 10 dígitos)")
    .max(20, "Número muito longo")
    .regex(/^[0-9()\s\-+]+$/, "Use apenas números e ( ) - + espaços"),
});

type LeadStatus = "idle" | "loading" | "success" | "error";

function formatWhatsapp(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function LeadForm() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<LeadStatus>("idle");
  const [errors, setErrors] = useState<{ name?: string; whatsapp?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    const parsed = leadSchema.safeParse({ name, whatsapp });
    if (!parsed.success) {
      const fieldErrors: { name?: string; whatsapp?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "name" | "whatsapp";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      toast.error("Preencha os dados corretamente");
      return;
    }

    setErrors({});
    setStatus("loading");
    try {
      // Simula envio (troque por chamada real ao seu CRM/webhook).
      await new Promise((r) => setTimeout(r, 900));
      try {
        const list = JSON.parse(localStorage.getItem("espetinho_leads") || "[]");
        list.push({ ...parsed.data, at: new Date().toISOString() });
        localStorage.setItem("espetinho_leads", JSON.stringify(list));
      } catch {
        // ignore storage errors
      }
      setStatus("success");
      toast.success("Cupom reservado!", {
        description: "Enviamos os detalhes no seu WhatsApp.",
      });
    } catch (err) {
      console.error("[lead-form] falha no envio:", err);
      setStatus("error");
      toast.error("Não conseguimos enviar agora", {
        description: "Verifique sua conexão e tente novamente.",
        action: { label: "Tentar de novo", onClick: () => handleSubmit(e) },
      });
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="w-full max-w-md rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-6 text-center"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fire shadow-fire">
          <CheckCircle2 className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-xl font-black">Tudo certo, {name.split(" ")[0]}!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu cupom foi reservado. Agora é só garantir seu acesso abaixo.
        </p>
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md rounded-2xl border border-border bg-background/40 p-5 text-left"
    >
      <p className="mb-4 text-center text-sm font-semibold text-[color:var(--gold)]">
        Receba o cupom de desconto no seu WhatsApp
      </p>

      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Seu nome
      </label>
      <div className="relative mt-1.5">
        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          maxLength={80}
          autoComplete="name"
          placeholder="Como você quer ser chamado(a)"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "lead-name-err" : undefined}
          className={`w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--gold)] disabled:opacity-60 ${
            errors.name ? "border-red-500/60" : "border-border"
          }`}
        />
      </div>
      {errors.name && (
        <p id="lead-name-err" className="mt-1.5 text-xs text-red-400">
          {errors.name}
        </p>
      )}

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Seu WhatsApp
      </label>
      <div className="relative mt-1.5">
        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="tel"
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
          disabled={loading}
          maxLength={20}
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          aria-invalid={!!errors.whatsapp}
          aria-describedby={errors.whatsapp ? "lead-wpp-err" : undefined}
          className={`w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--gold)] disabled:opacity-60 ${
            errors.whatsapp ? "border-red-500/60" : "border-border"
          }`}
        />
      </div>
      {errors.whatsapp && (
        <p id="lead-wpp-err" className="mt-1.5 text-xs text-red-400">
          {errors.whatsapp}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="btn-fire mt-5 w-full !py-3 !text-sm disabled:opacity-80 disabled:cursor-wait"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            Quero meu cupom <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        <Lock className="mr-1 inline h-3 w-3" /> Seus dados ficam seguros. Sem spam.
      </p>
    </form>
  );
}

// ---- Sections ----

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fire shadow-fire">
            <Flame className="h-5 w-5 text-white" />
          </span>
          <span className="truncate font-display text-base tracking-wide sm:text-xl">
            ESPETINHO <span className="text-gradient-fire">NA VEIA</span>
          </span>
        </a>
        <nav className="hidden gap-6 text-sm text-muted-foreground lg:flex xl:gap-8">
          <a href="#beneficios" className="hover:text-foreground transition">Benefícios</a>
          <a href="#modulos" className="hover:text-foreground transition">Módulos</a>
          <a href="#bonus" className="hover:text-foreground transition">Bônus</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </nav>
        <a href="#oferta" className="btn-fire shrink-0 !min-h-0 !py-2 !px-4 text-xs sm:!px-5 sm:text-sm">
          Quero o eBook
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-20 pb-10 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[320px] w-[600px] -translate-x-1/2 rounded-full bg-[color:var(--ember)]/25 blur-3xl sm:h-[520px] sm:w-[960px] animate-pulse-glow" />
        <div className="absolute right-0 top-40 h-[280px] w-[280px] rounded-full bg-[color:var(--gold)]/15 blur-3xl" />
      </div>
      
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col items-start">
          <Reveal variant="clip">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--ember)] shadow-[0_0_20px_-4px_var(--ember)] backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--ember)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--ember)]" />
              </span>
              Edição 2026 · Método completo
            </span>
          </Reveal>

          {/* Mobile-only hero image (below badge) */}
          <Reveal variant="scale" delay={1} className="relative mt-5 w-full lg:hidden">
            <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-fire opacity-30 blur-3xl animate-pulse-glow" />
            <div className="glass relative overflow-hidden rounded-[1.5rem] p-1.5 shadow-fire animate-float">
              <img
                src={heroChef.url}
                alt="Chef especialista em espetinhos com espetos flamejantes"
                className="h-[300px] w-full rounded-[1.25rem] object-cover sm:h-[420px]"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </Reveal>

          <Reveal variant="blur" delay={1} as="h1" className="mt-5 h-fluid-hero font-black sm:mt-6">
            Lucre até <span className="animated-fire-text">R$ 300 por dia</span> vendendo espetinhos — começando do zero
          </Reveal>
          <Reveal variant="up" delay={2} as="p" className="mt-5 max-w-xl text-fluid-lead text-muted-foreground sm:mt-6">
            O método completo para montar, temperar, precificar e vender espetinhos com alta margem — mesmo sem experiência e com pouco investimento.
          </Reveal>

          <Reveal variant="up" delay={3} className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row">
            <CTAButton size="xl">
              Quero começar agora <ArrowRight className="h-5 w-5" />
            </CTAButton>
            <a href="#beneficios" className="btn-ghost-fire w-full sm:w-auto">
              Ver o que aprendo
            </a>
          </Reveal>

          <Reveal variant="up" delay={3} className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--ember)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--flame)]" />
              </span>
              Método já aplicado por vendedores em <strong className="text-foreground">+120 cidades</strong> do Brasil
            </span>
          </Reveal>

          <Reveal variant="up" delay={4} className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { n: "300%", l: "margem" },
              { n: "14", l: "capítulos" },
              { n: "7 dias", l: "garantia" },
            ].map((s) => (
              <div key={s.l} className="glass gradient-border rounded-xl px-3 py-3 text-center transition hover:-translate-y-0.5">
                <div className="font-display text-xl leading-none text-gradient-fire sm:text-2xl">{s.n}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">{s.l}</div>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal variant="right" delay={2} className="relative hidden lg:block">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-fire opacity-30 blur-3xl animate-pulse-glow" />
          <div className="glass gradient-border relative overflow-hidden rounded-[2rem] p-2 shadow-fire animate-float">
            <img
              src={heroChef.url}
              alt="Chef especialista em espetinhos com espetos flamejantes"
              className="h-[520px] w-full rounded-[1.75rem] object-cover"
              loading="eager"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LogosBar() {
  const items = [
    { icon: Users, label: "+2.000 leitores" },
    { icon: Star, label: "4.9 / 5 estrelas" },
    { icon: ShieldCheck, label: "7 dias de garantia" },
    { icon: Zap, label: "Acesso imediato" },
  ];
  return (
    <div className="border-y border-border/60 bg-background/40 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-6 sm:grid-cols-4 sm:px-6">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-[color:var(--gold)]" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pain() {
  const pains = [
    { icon: Beef, title: "Escolhe a carne errada", desc: "Compra caro, o cliente reclama e o lucro some." },
    { icon: Utensils, title: "Não sabe temperar", desc: "O sabor fica sem graça e o cliente não volta." },
    { icon: Calculator, title: "Não sabe precificar", desc: "Vende no chute e trabalha muito ganhando pouco." },
    { icon: DollarSign, title: "Lucro apertado", desc: "Trabalha o mês inteiro e não sobra dinheiro." },
    { icon: Truck, title: "Compra ingrediente caro", desc: "Não conhece fornecedores certos e paga a mais." },
    { icon: Heart, title: "Medo de investir", desc: "Trava por não ter um método claro passo a passo." },
  ];
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>O problema</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            Você já se viu <span className="text-gradient-fire">preso em algum destes erros?</span>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A maioria de quem tenta vender espetinho cai nas mesmas armadilhas — e desiste antes de ver o real potencial do negócio.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pains.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:border-[color:var(--ember)]/40">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--ember)]/15 text-[color:var(--ember)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthorSolution() {
  const slides = [
    { src: platter1.url, alt: "Tábua premium de espetinhos variados", tag: "Análise: tábua premium", metric: "Margem 300%" },
    { src: skewersHeld.url, alt: "Espetinhos suculentos", tag: "Detecção: ponto suculento", metric: "Fidelização +82%" },
    { src: ribeye.url, alt: "Corte nobre bovino", tag: "Identificado: corte nobre", metric: "Custo/kg otimizado" },
    { src: platter2.url, alt: "Espetinhos servidos", tag: "Padrão: apresentação PRO", metric: "Ticket médio +40%" },
  ];
  const bullets = [
    "Passo a passo direto ao ponto — sem enrolação.",
    "Temperos exclusivos que fidelizam qualquer cliente.",
    "Precificação inteligente para lucrar de verdade.",
    "Estratégias de venda para atrair clientes todo dia.",
  ];

  const [idx, setIdx] = useState(0);
  const [visibleBullets, setVisibleBullets] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 2800);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (visibleBullets >= bullets.length) return;
    const t = setTimeout(() => setVisibleBullets((n) => n + 1), 450);
    return () => clearTimeout(t);
  }, [visibleBullets, bullets.length]);

  const current = slides[idx];

  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Author header */}
        <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
          <div className="relative mx-auto lg:mx-0">
            <div className="absolute -inset-3 -z-10 rounded-3xl bg-fire opacity-25 blur-2xl" />
            <img
              src={chefWorking.url}
              alt="Autor no dia a dia da grelha"
              className="h-[220px] w-[220px] rounded-3xl object-cover shadow-fire sm:h-[260px] sm:w-[260px]"
              loading="lazy"
            />
          </div>
          <div>
            <SectionTag>Quem escreveu · A história real</SectionTag>
            <h2 className="mt-5 h-fluid-h2 font-black">
              De açougueiro sem R$ 1.000 no bolso a dono do <span className="text-gradient-fire">Espetos Grill</span>.
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Meu nome é <strong className="text-foreground">Ronnei</strong>. Comecei aos 17 anos trabalhando de açougueiro no supermercado
              e, no horário de almoço, fabricava espetinhos pra vender à noite. Foram 12 anos de rotina pesada —
              domingo, feriado, tudo eu vendia. Sem dinheiro, sem atalho, só na raça.
            </p>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Comecei num cantinho minúsculo. Passei pela pandemia, quase quebrei, aprendi na dor que dinheiro
              da empresa não é seu e que a culpa de todo BO é do dono. Hoje o <strong className="text-foreground">Espetos Grill</strong> fatura
              mais de <span className="text-gradient-fire font-black">R$ 350 mil/mês</span> — e o que está nesse eBook é o passo a passo que eu queria ter recebido lá atrás.
            </p>
            <div className="mt-6 grid max-w-md gap-3 sm:grid-cols-3">
              {[
                { n: "10+", l: "anos na brasa" },
                { n: "R$350k", l: "faturamento/mês" },
                { n: "0", l: "começou do zero" },
              ].map((s) => (
                <div key={s.l} className="glass rounded-2xl p-3 text-center">
                  <div className="text-xl font-black text-gradient-fire sm:text-2xl">{s.n}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-[color:var(--gold)]/30 to-transparent" />

        {/* AI Solution */}
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* AI viewer */}
        <div className="relative lg:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--gold)]/20 bg-card/60 p-3 shadow-fire backdrop-blur">
            {/* header bar */}
            <div className="flex items-center justify-between px-2 pb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-fire">
                  <Sparkles className="h-3 w-3 text-white" />
                </span>
                IA · Análise de mercado
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: "ai-blip 1.4s ease-in-out infinite" }} />
                <span className="text-[10px] uppercase tracking-widest text-emerald-400/90">live</span>
              </div>
            </div>

            {/* image stage */}
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] sm:max-w-[240px] overflow-hidden rounded-2xl bg-background">
              {slides.map((s, i) => (
                <img
                  key={s.src}
                  src={s.src}
                  alt={s.alt}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                    i === idx ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  }`}
                />
              ))}

              {/* gradient overlays */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-background/40" />

              {/* grid overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "linear-gradient(oklch(1 0 0 / 0.08) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.08) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />

              {/* corner brackets */}
              {[
                "top-3 left-3 border-t-2 border-l-2",
                "top-3 right-3 border-t-2 border-r-2",
                "bottom-3 left-3 border-b-2 border-l-2",
                "bottom-3 right-3 border-b-2 border-r-2",
              ].map((c) => (
                <span key={c} className={`pointer-events-none absolute h-6 w-6 border-[color:var(--gold)] ${c}`} />
              ))}

              {/* scan line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-[color:var(--gold)]/40 to-transparent"
                style={{ animation: "ai-scan 2.8s linear infinite" }}
              />

              {/* floating tag */}
              <div key={idx} className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[color:var(--gold)]/40 bg-background/70 px-3 py-1.5 text-[11px] font-medium backdrop-blur animate-fade-in">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" style={{ animation: "ai-blip 1.2s ease-in-out infinite" }} />
                {current.tag}
              </div>

              {/* metric card */}
              <div key={`m-${idx}`} className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-3 backdrop-blur animate-fade-in">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Insight detectado</div>
                  <div className="text-sm font-bold text-foreground">{current.metric}</div>
                </div>
                <TrendingUp className="h-5 w-5 text-[color:var(--gold)]" />
              </div>
            </div>

            {/* dots / progress */}
            <div className="mt-3 flex items-center justify-center gap-1.5 pb-1">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === idx ? "w-6 bg-[color:var(--gold)]" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ambient glow */}
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[color:var(--ember)]/20 blur-3xl" />
        </div>

        {/* Copy */}
        <div className="lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--gold)]">
            <Sparkles className="h-3 w-3" /> IA · A solução
          </div>
          <h2 className="mt-4 h-fluid-h3 font-black sm:text-2xl">
            Um método <span className="text-gradient-fire">testado na brasa</span>, feito para quem quer resultado.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            O <strong className="text-foreground">Espetinho na Veia</strong> reúne, num só material,
            tudo o que você precisa para transformar espetinho em uma máquina de fazer dinheiro:
            da escolha da carne ao pós-venda.
          </p>
          <ul className="mt-5 space-y-2 text-sm sm:text-base">
            {bullets.map((t, i) => (
              <li
                key={t}
                className={`flex items-start gap-3 transition-all duration-500 ${
                  i < visibleBullets ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                }`}
              >
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-fire">
                  <Check className="h-3 w-3 text-white" />
                </span>
                <span>{t}</span>
              </li>
            ))}
            {visibleBullets < bullets.length && (
              <li className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-[color:var(--gold)] [animation-delay:-0.3s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-[color:var(--gold)] [animation-delay:-0.15s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-[color:var(--gold)]" />
                </span>
                Gerando insights…
              </li>
            )}
          </ul>
          <div className="mt-8">
            <CTAButton>Quero acessar o método <ArrowRight className="h-4 w-4" /></CTAButton>
          </div>
        </div>
      </div>
      </div>
    </section>

  );
}

function Benefits() {
  const items = [
    { icon: DollarSign, title: "Até 300% de margem", desc: "Aprenda a precificar cada espeto para lucrar de verdade, sem trabalhar de graça." },
    { icon: Beef, title: "Carne que rende mais", desc: "Cortes certos, quantidade certa por espeto e menos desperdício no fim do dia." },
    { icon: Flame, title: "Ponto e brasa perfeitos", desc: "O segredo do ponto suculento que faz o cliente voltar e indicar pra todo mundo." },
    { icon: Sparkles, title: "Tempero que fideliza", desc: "A marinada da casa que transforma espeto comum em 'o melhor da região'." },
    { icon: Users, title: "Fila no seu ponto", desc: "Onde montar, como atrair e como fazer o movimento não parar nem em dia de semana." },
    { icon: TrendingUp, title: "Do carrinho ao trailer", desc: "Passo a passo real para escalar de renda extra a negócio de 10k por mês." },
  ];
  return (
    <section id="beneficios" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Benefícios</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            O que vai <span className="text-gradient-fire">mudar no seu bolso</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-[color:var(--gold)]/50 hover:shadow-fire"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fire opacity-0 blur-3xl transition-opacity group-hover:opacity-20" />
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-fire shadow-fire">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfitCalculator() {
  const [qty, setQty] = useState(50);
  const [price, setPrice] = useState(8);
  const cost = 2.2; // custo médio por espeto (carne + carvão + palito + tempero)
  const daysMonth = 26;

  const revenueDay = qty * price;
  const costDay = qty * cost;
  const profitDay = revenueDay - costDay;
  const profitMonth = profitDay * daysMonth;
  const marginPct = revenueDay > 0 ? Math.round((profitDay / revenueDay) * 100) : 0;

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <section id="calculadora" className="relative py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Simulador · quanto você pode faturar</SectionTag>
          <h2 className="mt-4 max-w-2xl h-fluid-h3 font-black">
            Faça a <span className="text-gradient-fire">conta na sua tela</span> agora
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Ajuste quantidade e preço. Cálculo em tempo real com custo médio de {fmt(cost)}/espeto.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* Inputs */}
          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="space-y-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="qty" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Espetos / dia
                  </label>
                  <span className="text-xl font-black text-gradient-fire">{qty}</span>
                </div>
                <input
                  id="qty"
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[color:var(--gold)]"
                  aria-label="Espetos vendidos por dia"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="price" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Preço / espeto
                  </label>
                  <span className="text-xl font-black text-gradient-fire">{fmt(price)}</span>
                </div>
                <input
                  id="price"
                  type="range"
                  min={5}
                  max={20}
                  step={0.5}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[color:var(--gold)]"
                  aria-label="Preço por espeto"
                />
              </div>

              <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Faturamento/dia</span>
                  <span className="font-bold">{fmt(revenueDay)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Custo/dia</span>
                  <span className="font-bold text-red-400/90">− {fmt(costDay)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border/60 pt-1">
                  <span className="text-muted-foreground">Margem</span>
                  <span className="font-bold">{marginPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--gold)]/30 bg-card/60 p-5 shadow-fire">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fire opacity-20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-[color:var(--gold)]" />
                Lucro estimado
              </div>

              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Por dia</div>
                <div className="mt-1 text-4xl font-black text-gradient-fire sm:text-5xl">
                  {fmt(profitDay)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Semana</div>
                  <div className="mt-0.5 text-lg font-black">{fmt(profitDay * 6)}</div>
                </div>
                <div className="rounded-xl border border-[color:var(--gold)]/40 bg-fire/10 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">Mês (26d)</div>
                  <div className="mt-0.5 text-lg font-black text-gradient-fire">{fmt(profitMonth)}</div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                * Estimativa com base em custos médios de mercado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const prints = [
    { src: printWhats1, alt: "Print de WhatsApp: aluno faturou R$ 480 no primeiro fim de semana", tag: "R$ 480 / fim de semana" },
    { src: printWhats2, alt: "Print de Instagram: aluna de Goiânia vendeu 320 espetinhos em um sábado", tag: "320 espetos / sábado" },
    { src: printWhats3, alt: "Print de WhatsApp: aluno corrigiu precificação após o eBook", tag: "Precificação corrigida" },
    { src: printPix, alt: "Print de recebimentos via Pix de um vendedor de espetinhos", tag: "Pix caindo direto" },
  ];
  return (
    <section id="depoimentos" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Prova real</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            Alunos que <span className="text-gradient-fire">colocaram a mão na brasa</span> e viram resultado
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Prints reais de quem aplicou o método. Nomes preservados por privacidade.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
          {prints.map((p) => (
            <figure
              key={p.alt}
              className="glass group relative overflow-hidden rounded-2xl border border-white/10 p-2 transition hover:-translate-y-1 hover:border-[color:var(--gold)]/40"
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  width={720}
                  height={1024}
                  className="aspect-[9/16] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--gold)] backdrop-blur-sm sm:text-xs">
                  🔥 {p.tag}
                </span>
              </div>
            </figure>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground sm:text-sm">
          * Resultados variam conforme dedicação, região e aplicação do método.
        </p>
      </div>
    </section>
  );
}

function Modules() {
  const modules = [
    { icon: BookOpen, title: "A história por trás do Espetinho na Veia", desc: "A trajetória real que deu origem ao método." },
    { icon: TrendingUp, title: "Por que espetinho é um dos negócios mais lucrativos da rua", desc: "Entenda o potencial desse mercado bilionário." },
    { icon: DollarSign, title: "Quanto dá para ganhar vendendo espetinhos", desc: "Números reais de faturamento e margem." },
    { icon: Target, title: "O que você precisa para começar do zero", desc: "Estrutura, equipamentos e investimento inicial." },
    { icon: Flame, title: "Os espetinhos que mais vendem", desc: "Os campeões de venda que não podem faltar no seu cardápio." },
    { icon: ChefHat, title: "Como escolher a carne certa para lucrar mais", desc: "Cortes ideais, onde comprar e como economizar." },
    { icon: ClipboardList, title: "Como montar o espetinho perfeito", desc: "Técnica de montagem para padrão profissional." },
    { icon: Sparkles, title: "O segredo do tempero simples e saboroso", desc: "A fórmula de tempero que fideliza clientes." },
    { icon: Calculator, title: "Como assar espetinhos do jeito certo", desc: "Domine a brasa, o ponto e o tempo de cada carne." },
    { icon: Target, title: "Os melhores lugares para vender espetinhos", desc: "Onde e como se posicionar para vender todo dia." },
    { icon: TrendingUp, title: "Estratégias simples para vender muito mais", desc: "Táticas práticas para escalar suas vendas." },
    { icon: Award, title: "Os erros que fazem muitos desistirem do negócio", desc: "O que evitar para não perder tempo e dinheiro." },
    { icon: DollarSign, title: "O caminho para chegar aos 10k por mês", desc: "Passo a passo para alcançar o primeiro grande resultado." },
    { icon: Instagram, title: "Próximos passos para crescer ainda mais", desc: "Como transformar o espetinho em uma marca sólida." },
  ];
  const [open, setOpen] = useState(false);
  return (
    <section id="modulos" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>O que você recebe</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            14 capítulos <span className="text-gradient-fire">práticos e diretos</span>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Cada módulo foi pensado para você aplicar hoje mesmo — sem enrolação, sem teoria desnecessária.
          </p>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="modulos-lista"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/40 bg-fire/10 px-5 py-3 text-sm font-bold uppercase tracking-widest text-[color:var(--gold)] transition hover:bg-fire/20"
          >
            {open ? "Ocultar capítulos" : "Ver os 14 capítulos"}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div
          id="modulos-lista"
          className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-out ${
            open ? "mt-10 grid-rows-[1fr] opacity-100 sm:mt-12" : "mt-0 grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {modules.map(({ icon: Icon, title }, i) => (
                <div
                  key={title}
                  style={{ animationDelay: open ? `${i * 40}ms` : "0ms" }}
                  className={`glass group flex items-center gap-2 rounded-full px-3 py-2 transition hover:-translate-y-0.5 hover:border-[color:var(--gold)]/40 sm:px-4 sm:py-2.5 ${
                    open ? "animate-fade-in" : ""
                  }`}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fire text-white shadow-fire sm:h-7 sm:w-7">
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--gold)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold sm:text-sm">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bonuses() {
  const bonuses = [
    { icon: Truck, title: "Contato com fornecedores", tag: "Bônus 01", value: "R$ 97", desc: "Acesso direto a fornecedores confiáveis para comprar melhor e mais barato." },
    { icon: MessageCircle, title: "Grupo de WhatsApp", tag: "Bônus 02", value: "R$ 147", desc: "Comunidade exclusiva com outros alunos para trocar experiências e networking." },
    { icon: Award, title: "Certificado de conclusão", tag: "Bônus 03", value: "R$ 67", desc: "Certificado digital para validar sua formação no método Espetinho na Veia." },
    { icon: Sparkles, title: "Sorteio de faca profissional", tag: "Bônus 04", value: "R$ 250", desc: "Concorra a uma faca profissional para elevar o padrão da sua produção." },
  ];
  return (
    <section id="bonus" className="relative py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[color:var(--flame)]/40 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Bônus exclusivos</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            4 bônus <span className="text-gradient-fire">exclusivos e gratuitos</span>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Materiais e vantagens extras para acelerar seus resultados desde o primeiro dia.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2">
          {bonuses.map(({ icon: Icon, title, tag, value, desc }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-[color:var(--gold)]/60 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--gold)]/15 text-[color:var(--gold)] sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="shrink-0 rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-2.5 py-1 text-[10px] font-bold text-[color:var(--gold)] sm:px-3 sm:text-xs">
                  {tag}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold sm:mt-5 sm:text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">De {value}</span>
                <span className="rounded-full bg-fire px-2.5 py-0.5 text-xs font-bold text-white">GRÁTIS hoje</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total dos bônus */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--gold)]/40 bg-gradient-to-br from-[color:var(--gold)]/10 via-transparent to-[color:var(--ember)]/10 p-5 text-center backdrop-blur sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/70 to-transparent" />
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Valor total dos bônus
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-black text-muted-foreground/80 line-through decoration-[color:var(--ember)]/60 decoration-2 sm:text-4xl">
                R$ 561,00
              </span>
              <span className="rounded-full bg-fire px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-fire">
                GRÁTIS hoje
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Você recebe <strong className="text-foreground">todos os 4 bônus sem pagar nada a mais</strong> — inclusos no seu acesso ao eBook.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Results() {
  const before = ["Sem saber qual carne comprar", "Preços no chute", "Cliente esporádico", "Estresse na produção", "Lucro apertado"];
  const after = ["Carnes escolhidas com estratégia", "Preços com margem garantida", "Cliente fiel toda semana", "Rotina fluida e organizada", "Lucro previsível e crescente"];
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Transformação</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            Do improviso para o <span className="text-gradient-fire">negócio de verdade</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" /> Antes
            </div>
            <h3 className="mt-3 text-2xl font-bold">Você hoje</h3>
            <ul className="mt-5 space-y-3 text-muted-foreground">
              {before.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-3xl border border-[color:var(--ember)]/40 bg-gradient-to-br from-[color:var(--ember)]/10 to-[color:var(--gold)]/5 p-8 shadow-fire">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[color:var(--gold)]">
              <Flame className="h-4 w-4" /> Depois
            </div>
            <h3 className="mt-3 text-2xl font-bold">Você com o método</h3>
            <ul className="mt-5 space-y-3">
              {after.map((a) => (
                <li key={a} className="flex items-start gap-3">
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-fire">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


function Testimonials() {
  const items = [
    {
      name: "Carlos M.",
      role: "Empreendedor iniciante",
      text: "Comecei com pouco e no primeiro mês já paguei o investimento do eBook várias vezes. A parte de precificação abriu meus olhos.",
      img: chefPortrait.url,
    },
    {
      name: "Marina R.",
      role: "Renda extra",
      text: "Vendia espetinho aos sábados no chute. Hoje vendo todo dia, com tempero exclusivo e clientes fiéis.",
      img: author.url,
    },
    {
      name: "João P.",
      role: "Trailer de espetinhos",
      text: "Reduzi desperdício, aumentei a margem e o movimento não para. O checklist de produção mudou minha rotina.",
      img: chefWorking.url,
    },
  ];
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Depoimentos ilustrativos</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            O que dizem <span className="text-gradient-fire">os leitores</span>
          </h2>
          <p className="mt-3 max-w-2xl text-xs uppercase tracking-widest text-muted-foreground">
            * Depoimentos fictícios apenas para demonstração visual — serão substituídos por depoimentos reais.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="glass flex flex-col rounded-2xl p-6">
              <div className="flex gap-0.5 text-[color:var(--gold)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-muted-foreground">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Offer() {
  const features = [
    "eBook completo com 14 capítulos (+30 páginas)",
    "4 bônus exclusivos (fornecedores, grupo VIP, certificado e sorteio)",
    "Acesso imediato após o pagamento",
    "Garantia incondicional de 7 dias",
  ];
  return (
    <section id="oferta" className="relative py-16 sm:py-24">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-[color:var(--ember)]/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-[color:var(--gold)]/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Offer card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[color:var(--card)]/60 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ember)]/70 to-transparent" />

            {/* Tag */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ember)]/25 bg-[color:var(--ember)]/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--ember)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--ember)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--ember)]" />
                </span>
                Oferta por tempo limitado
              </span>
            </div>

            {/* Price */}
            <div className="mt-8 text-center [font-variant-numeric:tabular-nums]">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                De <span className="text-base font-black text-muted-foreground/90 line-through decoration-[color:var(--ember)]/60 decoration-2">R$ 197,00</span> por apenas
              </div>

              <div className="mt-3 flex items-start justify-center gap-1.5">
                <span className="mt-3 text-xl font-semibold text-[color:var(--gold)]">R$</span>
                <span className="font-display text-7xl leading-none tracking-tight text-gradient-fire sm:text-8xl">
                  47
                </span>
                <span className="mt-3 text-xl font-semibold text-[color:var(--gold)]">,90</span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-3 py-1">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--gold)]">Economize 76%</span>
                <span className="h-3 w-px bg-[color:var(--gold)]/40" />
                <span className="text-xs font-bold text-[color:var(--gold)]">R$ 149,10 OFF</span>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">ou</span>
                <span className="text-sm font-bold text-[color:var(--gold)]">3x de R$ 17,00</span>
                <span className="text-[10px] text-muted-foreground">no cartão</span>
              </div>
            </div>

            <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <ul className="grid gap-3">
              {features.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/15">
                    <Check className="h-3 w-3 text-[color:var(--ember)]" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/85">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <CheckoutButton />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/5 pt-5 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Compra segura</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Acesso imediato</span>
            </div>
          </div>

          {/* Guarantee card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--gold)]/30 bg-gradient-to-br from-[color:var(--gold)]/[0.08] via-transparent to-[color:var(--ember)]/[0.08] p-7 backdrop-blur-xl sm:p-9 flex flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold)]/70 to-transparent" />

            <div className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--gold)]">
                <ShieldCheck className="h-3 w-3" />
                Risco zero
              </span>
            </div>

            <div className="mt-6 flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[color:var(--gold)]/20 blur-2xl" />
                <div className="relative grid h-20 w-20 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-gradient-to-br from-[color:var(--gold)]/25 to-[color:var(--ember)]/20">
                  <Award className="h-10 w-10 text-[color:var(--gold)]" />
                </div>
              </div>

              <h3 className="mt-5 font-display text-2xl leading-tight sm:text-3xl">
                Garantia <span className="text-gradient-fire">incondicional</span>
                <br className="hidden sm:block" /> de 7 dias
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Teste o método sem pressa. Se por qualquer motivo não gostar,
                devolvemos <strong className="text-foreground">100% do seu dinheiro</strong>. O risco é todo nosso.
              </p>
            </div>

            <ul className="mt-6 grid gap-2.5 border-t border-white/5 pt-5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[color:var(--gold)]" strokeWidth={3} /> Reembolso em até 7 dias</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[color:var(--gold)]" strokeWidth={3} /> Sem burocracia ou perguntas</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[color:var(--gold)]" strokeWidth={3} /> Devolução 100% do valor pago</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}




function FAQ() {
  const faqs = [
    { q: "Preciso de muito dinheiro para começar?", a: "Não. O método mostra caminhos para começar pequeno, com investimento baixo e crescer de forma sustentável." },
    { q: "E se eu não gostar do material?", a: "Você tem 7 dias de garantia total. Se não gostar, basta pedir o reembolso e devolvemos 100% do valor. Sem perguntas." },
    { q: "Em quanto tempo recupero o investimento?", a: "Seguindo o plano de ação, muitos alunos recuperam o valor do eBook nas primeiras vendas — geralmente já na primeira semana." },
    { q: "Preciso ter experiência com churrasco?", a: "Não. O método foi pensado para iniciantes absolutos. Você é guiado passo a passo desde a escolha da carne até a venda." },
    { q: "E se eu morar em cidade pequena?", a: "As estratégias funcionam em qualquer região — cidade grande, interior, bairro residencial ou comercial." },
    { q: "Funciona também para delivery?", a: "Sim. Tem estratégias específicas para venda por WhatsApp, iFood e delivery próprio, além do ponto físico." },
    { q: "Como recebo o material?", a: "O acesso é liberado automaticamente por e-mail em minutos, após a confirmação do pagamento. Você lê no celular, tablet ou computador." },
  ];

  type Msg = { role: "user" | "ai"; text: string };
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Olá! 👋 Eu sou a Brunna, assistente do Ronnei. Escolhe uma pergunta ao lado que eu te respondo na hora." },
  ]);
  const [typing, setTyping] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const ask = (i: number) => {
    if (typing) return;
    const f = faqs[i];
    setActiveIdx(i);
    setMessages((m) => [...m, { role: "user", text: f.q }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: f.a }]);
      setTyping(false);
    }, 900);
  };

  return (
    <section id="faq" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Perguntas frequentes</SectionTag>
          <h2 className="mt-6 h-fluid-h2 font-black">
            Tire suas dúvidas com a <span className="text-gradient-fire">assistente</span>
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Clique em uma pergunta e receba a resposta na hora, como em um chat.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-6">
          {/* Left: questions */}
          <div className="rounded-2xl border border-border bg-card/60 p-3 backdrop-blur sm:p-4">
            <div className="mb-3 flex items-center gap-2 px-2 pt-1 text-xs uppercase tracking-widest text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5 text-[color:var(--gold)]" />
              Perguntas
            </div>
            <ul className="space-y-2">
              {faqs.map((f, i) => {
                const active = activeIdx === i;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => ask(i)}
                      disabled={typing}
                      className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:opacity-70 ${
                        active
                          ? "border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 text-foreground"
                          : "border-border bg-background/40 hover:border-[color:var(--gold)]/40 hover:bg-background/70"
                      }`}
                    >
                      <span className="font-medium">{f.q}</span>
                      <ArrowRight className={`h-4 w-4 shrink-0 transition ${active ? "text-[color:var(--gold)]" : "text-muted-foreground group-hover:text-[color:var(--gold)]"}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: chat */}
          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-fire shadow-fire">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-400" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Brunna • Assistente</div>
                  <div className="text-xs text-muted-foreground">Online • responde na hora</div>
                </div>
              </div>
              <div className="hidden items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:flex">
                <Sparkles className="h-3 w-3 text-[color:var(--gold)]" /> IA
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
              {messages.map((m, i) =>
                m.role === "ai" ? (
                  <div key={i} className="flex items-end gap-2">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fire">
                      <Flame className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-background/70 px-4 py-2.5 text-sm leading-relaxed text-foreground">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-fire px-4 py-2.5 text-sm leading-relaxed text-white shadow-fire">
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {typing && (
                <div className="flex items-end gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fire">
                    <Flame className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm border border-border bg-background/70 px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--gold)] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--gold)] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--gold)]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/60 bg-background/40 px-4 py-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2.5 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-[color:var(--gold)]" />
                <span className="truncate">Selecione uma pergunta ao lado…</span>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Ainda com dúvida? Fale com a gente pelo WhatsApp após a compra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.5rem] p-6 text-center sm:rounded-[2rem] sm:p-16">
          <img
            src={skewersFlat.url}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
            loading="lazy"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/90 via-background/80 to-[color:var(--ember)]/50" />
          <SectionTag>Última chamada</SectionTag>
          <h2 className="mx-auto mt-6 max-w-3xl h-fluid-h2 font-black">
            A brasa está pronta. <br />
            <span className="text-gradient-fire">Falta só você acender o fogo.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Cada dia sem o método é dinheiro deixado na tábua. Comece hoje, com garantia de 7 dias.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton size="xl">
              Quero o eBook agora <ArrowRight className="h-5 w-5" />
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/60 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-fire shadow-fire">
              <Flame className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-xl">ESPETINHO <span className="text-gradient-fire">NA VEIA</span></span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            O método que transforma espetinho em negócio de verdade.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-[color:var(--gold)]">Institucional</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/politica-de-privacidade" className="hover:text-foreground">Política de Privacidade</Link></li>
            <li><Link to="/termos-de-uso" className="hover:text-foreground">Termos de Uso</Link></li>
            <li><Link to="/perguntas-frequentes" className="hover:text-foreground">Perguntas frequentes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-[color:var(--gold)]">Contato</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@espetinhonaveia.com</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Suporte via WhatsApp</li>
          </ul>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-[color:var(--gold)]/60">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-[color:var(--gold)]/60">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-border/60 px-4 pt-6 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Espetinho na Veia. Todos os direitos reservados. Este produto não garante retornos financeiros — os resultados dependem da aplicação do método.
      </div>
    </footer>
  );
}

function ForYou() {
  const items = [
    "Você quer uma renda extra sem depender de patrão",
    "Já tentou vender espetinho e não conseguiu lucrar",
    "Curte churrasco e quer transformar isso em dinheiro",
    "Está desempregado e precisa começar com pouco",
    "Já vende, mas quer aumentar a margem e o volume",
    "Sonha em ter o próprio negócio para chamar de seu",
  ];
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Isso é pra você se…</SectionTag>
          <h2 className="mt-6 max-w-3xl h-fluid-h2 font-black">
            Se você se <span className="text-gradient-fire">identifica com um destes</span>, o eBook é pra você
          </h2>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {items.map((t) => (
            <div key={t} className="glass flex items-start gap-3 rounded-2xl p-5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fire">
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-base">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("espetinho_lead_popup_dismissed") === "1") return;
    if (localStorage.getItem("espetinho_leads")) return;
    const t = setTimeout(() => setOpen(true), 60_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    try {
      sessionStorage.setItem("espetinho_lead_popup_dismissed", "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-popup-title"
      className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[color:var(--gold)]/40 bg-card p-5 shadow-fire sm:p-6">
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-fire shadow-fire">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <h3 id="lead-popup-title" className="mt-3 h-fluid-h3 font-black">
            Espera! Garanta seu <span className="text-gradient-fire">cupom de desconto</span>
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Deixe seu nome e WhatsApp e receba um cupom exclusivo antes de sair.
          </p>
        </div>
        <div className="mt-4">
          <LeadForm />
        </div>
      </div>
    </div>
  );
}

function StickyMobileCTA() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-3 pt-3 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <a href="#oferta" className="btn-fire w-full !py-3 text-sm">
        Quero o eBook por R$ 47,90 <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="animate-aurora absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 30% 30%, oklch(0.63 0.24 27 / 0.45), transparent 60%)" }}
      />
      <div
        className="animate-aurora-2 absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 60% 40%, oklch(0.72 0.20 50 / 0.35), transparent 65%)" }}
      />
      <div
        className="animate-aurora absolute bottom-0 left-1/3 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.82 0.15 85 / 0.22), transparent 70%)" }}
      />
    </div>
  );
}

function LandingPage() {
  useEffect(() => {
    // Assign varied reveal variants per section so animations don't all feel the same.
    // Order below matches <main> children.
    const variantsBySection: Array<{ headline: string; card: string }> = [
      { headline: "up",    card: "up"     }, // Hero (mostly handled by <Reveal>)
      { headline: "clip",  card: "left"   }, // BrasaTicker (no h2)
      { headline: "clip",  card: "scale"  }, // ForYou
      { headline: "up",    card: "tilt"   }, // Benefits
      { headline: "left",  card: "rotate" }, // Modules
      { headline: "right", card: "right"  }, // AuthorSolution
      { headline: "clip",  card: "tilt"   }, // SocialProof
      { headline: "clip",  card: "scale"  }, // Bonuses
      { headline: "up",    card: "blur"   }, // Offer

      { headline: "up",    card: "up"     }, // FAQ
    ];

    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section, main > div"));
    sections.forEach((section, sIdx) => {
      const v = variantsBySection[sIdx] ?? { headline: "up", card: "up" };
      const headline = section.querySelector<HTMLElement>("h2");
      if (headline && !headline.hasAttribute("data-reveal")) {
        headline.setAttribute("data-reveal", v.headline);
      }
      const cards = Array.from(
        section.querySelectorAll<HTMLElement>(".glass, .rounded-2xl, .rounded-3xl"),
      );
      cards.forEach((n, i) => {
        if (!n.hasAttribute("data-reveal")) {
          n.setAttribute("data-reveal", v.card);
          const delay = ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
          if (delay > 1) n.setAttribute("data-reveal-delay", String(delay - 1));
        }
      });
    });

    const revealNow = (n: HTMLElement) => {
      if (n.dataset.visible !== "true") n.dataset.visible = "true";
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            revealNow(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    nodes.forEach((n) => io.observe(n));

    // Scroll fallback: catch anything IO missed (fast scroll / initial paint races)
    const onScroll = () => {
      const vh = window.innerHeight;
      for (const n of nodes) {
        if (n.dataset.visible === "true") continue;
        const r = n.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          revealNow(n);
          io.unobserve(n);
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />

        <ForYou />
        <Benefits />
        <ProfitCalculator />
        <AuthorSolution />
        <SocialProof />
        <Bonuses />
        <Modules />
        <Offer />
        <FAQ />

      </main>
      <Footer />
      <StickyMobileCTA />
      <LeadPopup />
    </div>
  );
}

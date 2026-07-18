import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]">
      <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
      className={`btn-fire w-full sm:w-auto ${size === "xl" ? "text-base sm:text-lg sm:!px-10 sm:!py-5" : ""} ${className}`}
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
      className={`btn-fire !text-lg !px-10 !py-5 w-full max-w-md disabled:opacity-80 disabled:cursor-wait ${className}`}
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
    <section id="top" className="relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[320px] w-[600px] -translate-x-1/2 rounded-full bg-[color:var(--ember)]/20 blur-3xl sm:h-[500px] sm:w-[900px]" />
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col items-start">
          <SectionTag>Método completo · edição 2026</SectionTag>
          <h1 className="mt-5 h-fluid-hero font-black sm:mt-6">
            Lucre até <span className="text-gradient-fire">R$ 300 por dia</span> vendendo espetinhos — começando do zero
          </h1>
          <p className="mt-5 max-w-xl text-fluid-lead text-muted-foreground sm:mt-6">
            O método completo para montar, temperar, precificar e vender espetinhos com alta margem — mesmo sem experiência e com pouco investimento.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row">
            <CTAButton size="xl">
              Quero começar agora <ArrowRight className="h-5 w-5" />
            </CTAButton>
            <a href="#beneficios" className="btn-ghost-fire w-full sm:w-auto">
              Ver o que aprendo
            </a>
          </div>
        </div>

        <div className="relative order-first lg:order-last">
          <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-fire opacity-30 blur-3xl animate-pulse-glow sm:-inset-6" />
          <div className="glass relative overflow-hidden rounded-[1.5rem] p-1.5 shadow-fire animate-float sm:rounded-[2rem] sm:p-2">
            <img
              src={heroChef.url}
              alt="Chef especialista em espetinhos com espetos flamejantes"
              className="h-[300px] w-full rounded-[1.25rem] object-cover sm:h-[420px] sm:rounded-[1.75rem] lg:h-[520px]"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
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

function Solution() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <img src={platter1.url} alt="Tábua premium de espetinhos variados" className="h-44 w-full rounded-2xl sm:h-64 object-cover shadow-fire" loading="lazy" />
            <img src={skewersHeld.url} alt="Espetinhos suculentos" className="mt-8 h-44 w-full rounded-2xl sm:h-64 object-cover shadow-fire" loading="lazy" />
            <img src={ribeye.url} alt="Corte nobre bovino" className="h-44 w-full rounded-2xl sm:h-64 object-cover shadow-fire" loading="lazy" />
            <img src={platter2.url} alt="Espetinhos servidos" className="mt-8 h-44 w-full rounded-2xl sm:h-64 object-cover shadow-fire" loading="lazy" />
          </div>
        </div>
        <div>
          <SectionTag>A solução</SectionTag>
          <h2 className="mt-6 h-fluid-h2 font-black">
            Um método <span className="text-gradient-fire">testado na brasa</span>, feito para quem quer resultado.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            O <strong className="text-foreground">Espetinho na Veia</strong> reúne, num só material,
            tudo o que você precisa saber para transformar espetinho em uma máquina de fazer dinheiro:
            da escolha da carne ao pós-venda.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Passo a passo direto ao ponto — sem enrolação.",
              "Temperos exclusivos que fidelizam qualquer cliente.",
              "Precificação inteligente para lucrar de verdade.",
              "Estratégias de venda para atrair clientes todo dia.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-fire">
                  <Check className="h-3 w-3 text-white" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <CTAButton>Quero acessar o método <ArrowRight className="h-4 w-4" /></CTAButton>
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
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {modules.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="glass flex items-start gap-4 rounded-2xl p-6 transition hover:-translate-y-0.5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-fire text-white shadow-fire">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--gold)]">
                  Módulo {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-1 text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
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
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {bonuses.map(({ icon: Icon, title, tag, value, desc }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-[color:var(--gold)]/60">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-3 py-1 text-xs font-bold text-[color:var(--gold)]">
                  {tag}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">De {value}</span>
                <span className="rounded-full bg-fire px-2.5 py-0.5 text-xs font-bold text-white">GRÁTIS hoje</span>
              </div>
            </div>
          ))}
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

function Author() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-fire opacity-25 blur-2xl" />
          <img
            src={chefWorking.url}
            alt="Autor no dia a dia da grelha"
            className="h-[320px] w-full rounded-3xl sm:h-[500px] object-cover shadow-fire"
            loading="lazy"
          />
        </div>
        <div>
          <SectionTag>Quem escreveu</SectionTag>
          <h2 className="mt-6 h-fluid-h2 font-black">
            Um método <span className="text-gradient-fire">nascido na brasa</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Anos servindo espetinho todos os dias, escutando cliente, ajustando ponto, corte e tempero.
            O que está no eBook é o que funciona de verdade — na prática, no calor da grelha, com fila esperando.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { n: "+10", l: "anos na brasa" },
              { n: "+2k", l: "leitores" },
              { n: "4.9", l: "avaliação" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-gradient-fire">{s.n}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
              </div>
            ))}
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

function Guarantee() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--gold)]/40 bg-gradient-to-br from-[color:var(--gold)]/10 via-transparent to-[color:var(--ember)]/10 p-10 text-center shadow-fire">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-fire shadow-fire animate-pulse-glow">
            <Award className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 h-fluid-h2 font-black">
            Garantia <span className="text-gradient-fire">incondicional de 7 dias</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Leia o eBook, teste o método e, se por qualquer motivo você não gostar,
            devolvemos <strong className="text-foreground">100% do seu dinheiro</strong>. Simples assim. O risco é todo nosso.
          </p>
        </div>
      </div>
    </section>
  );
}

function Offer() {
  return (
    <section id="oferta" className="relative py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--ember)]/25 blur-3xl" />
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-[color:var(--ember)]/40 bg-card p-6 shadow-fire sm:rounded-[2rem] sm:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fire opacity-20 blur-3xl" />
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-fire px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-fire animate-flicker">
              <Flame className="h-3.5 w-3.5" /> Oferta por tempo limitado
            </span>
            <h2 className="mt-6 h-fluid-h2 font-black">
              Comece hoje por <span className="text-gradient-fire">menos que um espetinho por dia</span>
            </h2>

            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="text-sm text-muted-foreground line-through">De R$ 197,00</div>
              <div className="flex items-end gap-2">
                <span className="text-lg font-bold text-[color:var(--gold)]">R$</span>
                <span className="font-display text-6xl leading-none text-gradient-fire sm:text-8xl">47</span>
                <span className="mb-2 text-lg font-bold text-[color:var(--gold)]">,90</span>
              </div>
              <div className="text-sm text-muted-foreground">
                ou <strong className="text-foreground">3x de R$ 17,00</strong> no cartão
              </div>
            </div>

            <ul className="mt-8 grid w-full max-w-md gap-2 text-left">
              {[
                "eBook completo com 14 capítulos (+30 páginas)",
                "4 bônus exclusivos (fornecedores, grupo VIP, certificado e sorteio)",
                "Acesso imediato após o pagamento",
                "Garantia incondicional de 7 dias",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-fire">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 w-full flex justify-center">
              <CheckoutButton />
            </div>


            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Compra 100% segura</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Acesso imediato</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> 7 dias de garantia</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Preciso ter experiência com churrasco?", a: "Não. O método foi pensado para iniciantes absolutos. Você é guiado passo a passo desde a escolha da carne até a venda." },
    { q: "Preciso de muito dinheiro para começar?", a: "Não. O método mostra caminhos para começar pequeno, com investimento baixo e crescer de forma sustentável." },
    { q: "E se eu morar em cidade pequena?", a: "As estratégias funcionam em qualquer região — cidade grande, interior, bairro residencial ou comercial." },
    { q: "Em quanto tempo posso começar a vender?", a: "Seguindo o plano de ação de 30 dias, muitos alunos fazem as primeiras vendas já na primeira semana." },
    { q: "Como recebo o material?", a: "O acesso é liberado automaticamente por e-mail em minutos, após a confirmação do pagamento. Você lê no celular, tablet ou computador." },
    { q: "E se eu não gostar do material?", a: "Você tem 7 dias de garantia total. Se não gostar, basta pedir o reembolso e devolvemos 100% do valor. Sem perguntas." },
    { q: "Funciona também para delivery?", a: "Sim. Tem estratégias específicas para venda por WhatsApp, iFood e delivery próprio, além do ponto físico." },
  ];
  return (
    <section id="faq" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <SectionTag>Perguntas frequentes</SectionTag>
          <h2 className="mt-6 h-fluid-h2 font-black">
            Tirando suas <span className="text-gradient-fire">últimas dúvidas</span>
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-border bg-card p-5 open:border-[color:var(--gold)]/40 transition"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                <span>{f.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-[color:var(--gold)] transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
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

function LandingPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Nav />
      <main>
        <Hero />
        
        <ForYou />
        <Benefits />
        <Modules />
        <Offer />
        <Author />
        <Guarantee />
        <Bonuses />
        <Solution />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyMobileCTA />
      <LeadPopup />
    </div>
  );
}

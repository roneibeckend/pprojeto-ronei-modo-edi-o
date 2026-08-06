import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Wand2, BookOpen, Loader2, Trash2, ArrowRight, AlertTriangle, Zap } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { generateEbook, type Ebook } from "@/lib/ebook-ai.functions";

export const Route = createFileRoute("/app/admin/ebook-ai")({
  head: () => ({ meta: [{ title: "IA — Gerador de Ebooks · Admin" }] }),
  component: EbookAIPage,
});

const STORAGE_KEY = "eiv:generated-ebooks";

type Stored = { id: string; title: string; subtitle: string; createdAt: string; slides: number; prompt: string };

function loadIndex(): Stored[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEbook(ebook: Ebook) {
  localStorage.setItem(`eiv:ebook:${ebook.id}`, JSON.stringify(ebook));
  const index = loadIndex();
  index.unshift({
    id: ebook.id,
    title: ebook.title,
    subtitle: ebook.subtitle,
    createdAt: ebook.createdAt,
    slides: ebook.slides.length,
    prompt: ebook.prompt,
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(index.slice(0, 30)));
}

function removeEbook(id: string) {
  localStorage.removeItem(`eiv:ebook:${id}`);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loadIndex().filter((e) => e.id !== id)));
}

const EXAMPLES = [
  "Crie um ebook prático ensinando como abrir um espetinho do zero investindo menos de R$ 500, evitando os erros mais comuns e chegando aos primeiros R$ 3 mil de faturamento.",
  "Ebook sobre precificação e lucro no espetinho: como calcular custo real da carne, definir preço de venda, margem ideal e evitar prejuízo escondido.",
  "Manual de vendas no espetinho: como atender bem, criar cardápio irresistível, fidelizar cliente e usar WhatsApp e Instagram pra dobrar o movimento.",
];

function EbookAIPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Stored[]>([]);
  const navigate = useNavigate();

  useEffect(() => setItems(loadIndex()), []);

  async function handleGenerate() {
    setError(null);
    if (prompt.trim().length < 10) {
      setError("Descreva melhor o ebook que quer gerar (mínimo 10 caracteres).");
      return;
    }
    setLoading(true);
    try {
      const ebook = await generateEbook({ data: { prompt } });
      saveEbook(ebook);
      setItems(loadIndex());
      navigate({ to: "/app/ebooks/gerado/$id", params: { id: ebook.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="IA · Gerador de Ebooks"
        subtitle="Descreva o ebook — a IA escreve o conteúdo e transforma no formato interativo premium automaticamente."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6a00] text-black shadow-lg">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">Descreva seu ebook</h3>
              <p className="text-xs text-muted-foreground">Tema, público, tom, o que ele deve ensinar e o que evitar.</p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Ex.: Ebook prático de 20 páginas ensinando como abrir um espetinho investindo pouco, com foco em precificação, atendimento e primeiras vendas..."
            className="mt-4 h-40 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-sm outline-none transition focus:border-primary"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(ex)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground transition hover:border-fire/40 hover:text-fire"
              >
                Exemplo {i + 1}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-fire mt-5 w-full justify-center text-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando ebook com IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Gerar ebook interativo
              </>
            )}
          </button>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3" /> IA gratuita via Lovable AI · Em breve integração com API própria para resultados ainda melhores.
          </p>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">Ebooks gerados</h3>
              <p className="text-xs text-muted-foreground">Salvos localmente neste navegador.</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
              Nenhum ebook gerado ainda. Escreva um prompt ao lado e gere o primeiro.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {items.map((it) => (
                <li key={it.id} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-fire/40">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{it.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {it.slides} slides · {new Date(it.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <Link
                    to="/app/ebooks/gerado/$id"
                    params={{ id: it.id }}
                    className="rounded-full bg-fire/20 p-2 text-fire transition hover:bg-fire/30"
                    aria-label="Abrir ebook"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      removeEbook(it.id);
                      setItems(loadIndex());
                    }}
                    className="rounded-full bg-white/5 p-2 text-muted-foreground opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

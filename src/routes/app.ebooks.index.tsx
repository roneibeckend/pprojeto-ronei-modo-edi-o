import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Download, Sparkles, ArrowRight, Lock, ShoppingCart, Loader2 } from "lucide-react";
import { CoverImage } from "@/components/platform/CoverImage";
import { PageHeader } from "@/components/platform/Shell";
import { useEbooks } from "@/hooks/use-queries";
import { IMG } from "@/lib/platform-data";

export const Route = createFileRoute("/app/ebooks/")({
  head: () => ({ meta: [{ title: "Biblioteca de e-books — Espetinho na Veia" }] }),
  component: EbooksPage,
});

function EbooksPage() {
  const { data: ebooksData, isLoading } = useEbooks();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Biblioteca de e-books" subtitle="Sua estante digital com todo o material didático." />

      <Link
        to="/app/ebooks/premium/$ebookId"
        params={{ ebookId: "do-zero-aos-10k" }}
        className="group relative mb-8 flex flex-col overflow-hidden rounded-3xl border border-fire/30 bg-gradient-to-br from-fire/20 via-black to-gold/10 p-6 transition hover:scale-[1.01] hover:border-fire/60 sm:flex-row sm:items-center sm:p-8"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fire/30 blur-3xl transition group-hover:bg-fire/50" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <img src={IMG.hero} alt="Do Zero aos 10k" className="relative h-40 w-full rounded-2xl object-cover shadow-2xl sm:h-48 sm:w-40 sm:shrink-0" loading="lazy" />
        <div className="relative mt-4 flex-1 sm:ml-6 sm:mt-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-fire/40 bg-fire/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-fire">
            <Sparkles className="h-3 w-3" /> Novo · Ebook Premium Interativo
          </div>
          <h2 className="mt-3 font-display text-2xl font-black leading-tight sm:text-3xl">Do Zero aos R$ 10k com Espetinho</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            30 páginas em estilo slide, com calculadoras, checklists, quizzes e roteiros prontos. Uma experiência de leitura totalmente nova.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-fire px-5 py-2 text-sm font-bold text-white shadow-lg">
            Abrir experiência premium <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      {ebooksData && ebooksData.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ebooksData.map((b: any) => (
            <article key={b.id} className={`glass card-tilt flex flex-col overflow-hidden rounded-2xl ${b.is_locked ? "ring-1 ring-fire/30" : ""}`}>
              <div className="relative aspect-[3/4]">
                <CoverImage src={b.cover_url} alt={b.title} className={b.is_locked ? "opacity-60 blur-[1px]" : ""} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
                  {b.category}
                </div>
                {b.is_locked && (
                  <>
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-fire/40 bg-black/70 px-4 py-3 backdrop-blur">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-fire text-black">
                          <Lock className="h-5 w-5" strokeWidth={2.5} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-fire">Bloqueado</div>
                      </div>
                    </div>
                    {b.price !== undefined && (
                      <div className="absolute right-3 top-3 rounded-full bg-fire px-3 py-1 text-xs font-bold text-black shadow-lg">
                        R$ {b.price.toFixed(2).replace(".", ",")}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <h3 className="font-display text-base font-bold leading-tight">{b.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.pages_count} páginas</span>
                  {b.is_locked && b.original_price && (
                    <span className="line-through opacity-60">R$ {b.original_price.toFixed(2).replace(".", ",")}</span>
                  )}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  {b.is_locked ? (
                    <button className="btn-fire flex-1 text-xs" type="button">
                      <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                    </button>
                  ) : (
                    <>
                      <Link to="/app/ebooks/$ebookId" params={{ ebookId: b.id }} className="btn-fire flex-1 text-xs">
                        <BookOpen className="h-3.5 w-3.5" /> Ler agora
                      </Link>
                      <button className="btn-ghost-fire text-xs" aria-label="Baixar PDF">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl border border-dashed border-white/10">
          <p className="text-muted-foreground">Nenhum e-book disponível na biblioteca no momento.</p>
        </div>
      )}
    </div>
  );
}

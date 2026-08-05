import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Download, Sparkles, ArrowRight, Lock, ShoppingCart, Loader2 } from "lucide-react";
import { CoverImage } from "@/components/platform/CoverImage";
import { PageHeader } from "@/components/platform/Shell";
import { useEbooks } from "@/hooks/use-queries";


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

      {/* Seção de Destaque Premium removida pois continha conteúdo não autorizado (do-zero-aos-10k) */}


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

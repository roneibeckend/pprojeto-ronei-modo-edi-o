import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Download, Sparkles, ArrowRight, Lock, ShoppingCart, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";

export const Route = createFileRoute("/app/ebooks/")({
  head: () => ({ meta: [{ title: "Biblioteca de e-books — Espetinho na Veia" }] }),
  component: EbooksPage,
});

function EbooksPage() {
  const { ebookEnrollments, isLoading: isLoadingEnrollments } = useEnrollments();

  const { data: dbEbooks, isLoading: isLoadingEbooks } = useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (isLoadingEbooks || isLoadingEnrollments) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  const owned = dbEbooks?.filter((b) => ebookEnrollments.includes(b.id) || b.price === 0) || [];
  const others = dbEbooks?.filter((b) => !ebookEnrollments.includes(b.id) && (b.price || 0) > 0) || [];

  return (
    <div>
      <PageHeader title="Biblioteca de e-books" subtitle="Sua estante digital com todo o material didático." />

      {/* Destaque para o primeiro ebook possuído se houver */}
      {owned.length > 0 && (
        <Link
          to="/app/ebooks/$ebookId"
          params={{ ebookId: owned[0].id }}
          className="group relative mb-8 flex flex-col overflow-hidden rounded-3xl border border-fire/30 bg-gradient-to-br from-fire/20 via-black to-gold/10 p-6 transition hover:scale-[1.01] hover:border-fire/60 sm:flex-row sm:items-center sm:p-8"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fire/30 blur-3xl transition group-hover:bg-fire/50" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <img src={owned[0].cover_url || ""} alt={owned[0].title} className="relative h-40 w-full rounded-2xl object-cover shadow-2xl sm:h-48 sm:w-40 sm:shrink-0" loading="lazy" />
          <div className="relative mt-4 flex-1 sm:ml-6 sm:mt-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-fire/40 bg-fire/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-fire">
              <Sparkles className="h-3 w-3" /> Sua Leitura Atual
            </div>
            <h2 className="mt-3 font-display text-2xl font-black leading-tight sm:text-3xl">{owned[0].title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{owned[0].description}</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-fire px-5 py-2 text-sm font-bold text-white shadow-lg">
              Continuar lendo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Ebooks Possuídos */}
        {owned.map((b) => (
          <article key={b.id} className="glass card-tilt flex flex-col overflow-hidden rounded-2xl">
            <div className="relative aspect-[3/4]">
              <img src={b.cover_url || ""} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
                {b.category}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="font-display text-base font-bold leading-tight">{b.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{b.pages_count} páginas</span>
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                <Link to="/app/ebooks/$ebookId" params={{ ebookId: b.id }} className="btn-fire flex-1 text-xs">
                  <BookOpen className="h-3.5 w-3.5" /> Ler agora
                </Link>
                <button className="btn-ghost-fire text-xs" aria-label="Baixar PDF">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Ebooks Disponíveis para Compra */}
        {others.map((b) => (
          <article key={b.id} className="glass card-tilt flex flex-col overflow-hidden rounded-2xl ring-1 ring-fire/30">
            <div className="relative aspect-[3/4]">
              <img src={b.cover_url || ""} alt={b.title} className="h-full w-full object-cover opacity-60 blur-[1px]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
                {b.category}
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-fire/40 bg-black/70 px-4 py-3 backdrop-blur">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-fire text-black">
                    <Lock className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-fire">Bloqueado</div>
                </div>
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-fire px-3 py-1 text-xs font-bold text-black shadow-lg">
                R$ {b.price?.toString().replace(".", ",")}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="font-display text-base font-bold leading-tight">{b.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{b.pages_count} páginas</span>
                {b.original_price && (
                  <span className="line-through opacity-60">R$ {b.original_price.toString().replace(".", ",")}</span>
                )}
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                <button className="btn-fire flex-1 text-xs" type="button">
                  <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

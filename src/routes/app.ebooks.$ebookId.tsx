import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ChevronLeft, ChevronRight, Loader2, ShoppingCart, BookOpen, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/platform/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { getAffiliateRef } from "@/hooks/use-affiliate-tracking";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: () => ({
    meta: [{ title: "E-book — Espetinho na Veia" }],
  }),
  loader: async ({ params }) => {
    const { data: ebook, error } = await supabase
      .from("ebooks")
      .select(`
        *,
        modules:ebook_modules (
          *,
          chapters:ebook_chapters (*)
        )
      `)
      .eq("id", params.ebookId)
      .single();

    if (error || !ebook) throw notFound();
    return { ebook };
  },
  component: EbookReaderPage,
});

function EbookReaderPage() {
  const { ebook } = Route.useLoaderData() as { ebook: any };
  const { isEnrolledInEbook, isLoading: isLoadingEnrollments } = useEnrollments();
  const [isProcessing, setIsProcessing] = useState(false);
  const createPaymentLink = useServerFn(createAsaasPaymentLink);

  const chapters = ebook.modules?.flatMap((m: any) => m.chapters || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)) || [];
  const [activeChapterId, setActiveChapterId] = useState<string | undefined>(chapters[0]?.id);
  
  const activeChapter = chapters.find((c: any) => c.id === activeChapterId) || chapters[0];
  const activeIndex = chapters.findIndex((c: any) => c.id === activeChapter?.id);
  
  const prevChapter = activeIndex > 0 ? chapters[activeIndex - 1] : null;
  const nextChapter = activeIndex < chapters.length - 1 ? chapters[activeIndex + 1] : null;

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      const result = await createPaymentLink({
        data: {
          productId: ebook.id,
          productType: 'ebook',
          title: ebook.title,
          description: ebook.description,
          value: ebook.price || 0,
          affiliateRef: getAffiliateRef() || undefined,
        }
      });
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      toast.error(error.message || "Erro ao gerar link de pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingEnrollments) {
    return (
      <div className="mx-auto max-w-5xl pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Skeleton className="h-[600px] w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <aside className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
            <Skeleton className="h-[200px] w-full rounded-3xl" />
          </aside>
        </div>
      </div>
    );
  }


  const isFree = (ebook.price || 0) === 0;
  const isEnrolled = isEnrolledInEbook(ebook.id);
  const hasAccess = isFree || isEnrolled;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-white/5 p-8 text-gold">
          <Lock className="h-16 w-16" />
        </div>
        <h2 className="font-display text-3xl font-black">{ebook.title}</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Este e-book é exclusivo para alunos. Adquira agora para liberar o acesso imediato ao conteúdo completo.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link to="/app/cursos" className="btn-ghost-fire px-8 py-3 font-bold">
            Voltar
          </Link>
          <button 
            onClick={handlePurchase}
            disabled={isProcessing}
            className="btn-fire px-10 py-3 font-bold shadow-lg shadow-fire/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
            {isProcessing ? "Processando..." : `Comprar por R$ ${ebook.price?.toString().replace(".", ",")}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <PageHeader
          title={ebook.title}
          subtitle={ebook.subtitle || "E-book Exclusivo"}
        />
        <Link to="/app/cursos" className="btn-ghost-fire text-sm w-full sm:w-auto">← Meus Conteúdos</Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Reader Area */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass min-h-[600px] overflow-hidden rounded-3xl pb-12"
            >
              {activeChapter?.video_url && (
                <div className="w-full bg-black/40 border-b border-white/5">
                  <div className="max-w-4xl mx-auto py-8 px-4">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/60 group">
                      <iframe
                        src={activeChapter.video_url.includes('youtube.com') 
                          ? activeChapter.video_url.replace('watch?v=', 'embed/') 
                          : activeChapter.video_url}
                        className="h-full w-full"
                        allowFullScreen
                      />
                      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8 md:p-12 mt-4">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h1 className="font-display text-3xl font-black tracking-tight md:text-4xl">
                    {activeChapter?.title}
                  </h1>
                  {activeChapter?.reading_minutes && (
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                      {activeChapter.reading_minutes} min de leitura
                    </span>
                  )}
                </div>

                <div className="prose prose-invert max-w-4xl mx-auto prose-p:text-muted-foreground prose-headings:text-foreground prose-p:leading-relaxed prose-p:text-lg">
                  {activeChapter?.content ? (
                    <div className="text-center md:text-left leading-relaxed text-lg text-white/80" dangerouslySetInnerHTML={{ __html: activeChapter.content }} />
                  ) : (
                    <p className="italic opacity-50">Conteúdo em breve...</p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              disabled={!prevChapter}
              onClick={() => setActiveChapterId(prevChapter?.id)}
              className="group flex flex-1 items-center gap-4 rounded-2xl bg-white/5 p-4 transition-all hover:bg-white/10 disabled:opacity-30"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-muted-foreground group-hover:text-fire">
                <ChevronLeft className="h-5 w-5" />
              </div>
              <div className="hidden text-left md:block">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Anterior</div>
                <div className="line-clamp-1 text-sm font-bold">{prevChapter?.title || "Início"}</div>
              </div>
            </button>

            <button
              disabled={!nextChapter}
              onClick={() => setActiveChapterId(nextChapter?.id)}
              className="group flex flex-1 items-center justify-end gap-4 rounded-2xl bg-white/5 p-4 text-right transition-all hover:bg-white/10 disabled:opacity-30"
            >
              <div className="hidden md:block">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Próximo</div>
                <div className="line-clamp-1 text-sm font-bold">{nextChapter?.title || "Fim"}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire text-white shadow-lg shadow-fire/20">
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Index */}
        <aside className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Conteúdo do E-book
            </h3>
            
            <div className="space-y-6">
              {ebook.modules?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((m: any) => (
                <div key={m.id}>
                  <div className="mb-3 px-2 text-xs font-bold text-fire/70 uppercase tracking-wider">{m.title}</div>
                  <div className="space-y-1">
                    {m.chapters?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((c: any) => {
                      const isActive = c.id === activeChapter?.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveChapterId(c.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all ${
                            isActive 
                              ? "bg-fire/10 text-fire font-bold" 
                              : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-fire" : "bg-white/20"}`} />
                          <span className="flex-1 truncate">{c.title}</span>
                          {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass overflow-hidden rounded-3xl p-6 text-center">
            <div className="mb-4 aspect-[3/4] overflow-hidden rounded-xl border border-white/5 bg-muted/20 shadow-2xl">
              <img src={ebook.cover_url || ebook.cover} alt={ebook.title} className="h-full w-full object-cover" />
            </div>
            <p className="text-xs text-muted-foreground">Você está lendo a versão digital completa.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

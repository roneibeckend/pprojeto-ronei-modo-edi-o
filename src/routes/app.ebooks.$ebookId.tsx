import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Lock, ShoppingCart, Loader2, Sparkles, LayoutPanelLeft, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: () => ({ meta: [{ title: "Leitura — Espetinho na Veia" }] }),
  loader: async ({ params }) => {
    const { data: ebook, error } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", params.ebookId)
      .single();

    if (error || !ebook) throw notFound();
    return { ebook };
  },
  component: EbookViewer,
});

function EbookViewer() {
  const { ebook } = Route.useLoaderData();
  const { isEnrolledInEbook, isLoading: isLoadingEnrollments } = useEnrollments();
  const [page, setPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const createPaymentLink = useServerFn(createAsaasPaymentLink);

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

  const isFree = (ebook.price || 0) === 0;
  const isEnrolled = isEnrolledInEbook(ebook.id);
  const hasAccess = isFree || isEnrolled;

  if (isLoadingEnrollments) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-white/5 p-8 text-gold">
          <Lock className="h-16 w-16" />
        </div>
        <h2 className="font-display text-3xl font-black">{ebook.title}</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Este e-book é exclusivo para quem adquiriu o material. Libere seu acesso agora mesmo.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link to="/app/ebooks" className="btn-ghost-fire px-8 py-3 font-bold">
            Voltar à biblioteca
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <Link to="/app/ebooks" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-fire transition">
            <ArrowLeft className="h-3 w-3" /> Voltar à biblioteca
          </Link>
          <h1 className="mt-1 font-display text-xl font-bold">{ebook.title}</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold">
             <span className="text-fire">{page}</span>
             <span className="text-white/20">/</span>
             <span className="text-white/40">{ebook.pages_count}</span>
           </div>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="mt-6 flex flex-1 items-center justify-center overflow-hidden">
        <div className="relative aspect-[3/4] h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
          {/* Mock Content */}
          <div className="flex h-full flex-col p-10 text-center">
            <div className="mb-10 flex justify-center">
              <Sparkles className="h-12 w-12 text-gold/30" />
            </div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tighter">
              {ebook.content ? `Material Completo` : `Capítulo ${page}`}
            </h2>
            <div className="mt-10 space-y-4 text-left leading-relaxed text-white/80 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {ebook.content ? (
                <div className="whitespace-pre-wrap font-serif text-lg">
                  {ebook.content}
                </div>
              ) : (
                <>
                  <p>Este é um exemplo de conteúdo do e-book <strong>{ebook.title}</strong>.</p>
                  <p>Aqui o aluno encontrará o material didático completo, formatado para uma leitura agradável tanto no computador quanto no celular.</p>
                  <p>O conteúdo real será carregado conforme o progresso da página.</p>
                </>
              )}
            </div>
            <div className="mt-auto pt-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
              Espetinho na Veia · Material Exclusivo
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:opacity-20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button 
          onClick={() => setPage(p => Math.min(ebook.pages_count || 1, p + 1))}
          disabled={page === ebook.pages_count}
          className="grid h-12 w-12 place-items-center rounded-full border border-fire/20 bg-fire/10 text-fire transition hover:bg-fire/20 disabled:opacity-20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

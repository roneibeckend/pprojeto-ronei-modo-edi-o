import { useState } from "react";
import { 
  Lock, 
  ShoppingCart, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  BookOpen,
  ChevronRight,
  MonitorPlay,
  Play,
  LayoutPanelLeft
} from "lucide-react";

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: () => ({ 
    meta: [
      { title: "E-book — Espetinho na Veia" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" }
    ] 
  }),
  loader: async ({ params }) => {
    const { data: ebook, error } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", params.ebookId)
      .single();

    if (error || !ebook) throw notFound();
    return { ebook };
  },
  component: EbookPage,
});

function EbookPage() {
  const { ebook } = Route.useLoaderData();
  const { ebookId } = Route.useParams();
  const { user } = useAuth();
  const { isEnrolledInEbook, isLoading: isLoadingEnrollments } = useEnrollments();
  const [isProcessing, setIsProcessing] = useState(false);
  const createPaymentLink = useServerFn(createAsaasPaymentLink);

  // Fetch modules
  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ["ebook-modules", ebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_modules")
        .select("*")
        .eq("ebook_id", ebookId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: isLoadingChapters } = useQuery({
    queryKey: ["ebook-chapters", ebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_chapters")
        .select("*")
        .eq("ebook_id", ebookId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch progress
  const { data: progress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ["ebook-progress", ebookId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("ebook_progress")
        .select("*")
        .in("chapter_id", chapters.map(c => c.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && chapters.length > 0,
  });

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
      if (result.url) window.location.href = result.url;
    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      toast.error(error.message || "Erro ao gerar link de pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasAccess = (ebook.price || 0) === 0 || isEnrolledInEbook(ebook.id);
  const completedCount = progress.filter(p => p.completed_at).length;
  const overallProgress = chapters.length > 0 ? (completedCount / chapters.length) * 100 : 0;
  const totalMinutes = chapters.reduce((acc, curr) => acc + (curr.reading_minutes || 0), 0);

  if (isLoadingEnrollments) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[#0a0a0a] min-h-screen">
        <div className="mb-6 rounded-full bg-white/5 p-8 text-[#ff6a00]">
          <Lock className="h-16 w-16" />
        </div>
        <h2 className="font-display text-3xl font-black text-white">{ebook.title}</h2>
        <p className="mt-4 max-w-md text-white/60">
          Este e-book é exclusivo para alunos. Libere seu acesso e comece a ler agora mesmo.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link to="/app/ebooks" className="btn-ghost-fire px-8 py-3 font-bold">
            Voltar à biblioteca
          </Link>
          <button 
            onClick={handlePurchase}
            disabled={isProcessing}
            className="btn-fire px-10 py-3 font-bold shadow-lg shadow-[#ff6a00]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
            {isProcessing ? "Processando..." : `Comprar por R$ ${ebook.price?.toString().replace(".", ",")}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Header Compacto */}
      <header className="sticky top-0 z-50 w-full h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 lg:px-8 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/app/ebooks" className="p-2 hover:bg-white/5 rounded-full transition text-white/60 hover:text-white flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-sm font-bold truncate text-white/90">{ebook.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {Math.round(overallProgress)}% concluído
              </span>
              <div className="w-24 lg:w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#ff6a00]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10 lg:py-16">
        {/* Hero de Vídeo */}
        <section className="flex flex-col items-center mb-16 lg:mb-24">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[#ff6a00]/10 text-[#ff6a00] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Aula Introdutória
            </span>
            <h2 className="font-display text-3xl lg:text-5xl font-black uppercase tracking-tight leading-none mb-6">
              {ebook.title}
            </h2>
          </div>

          <div className="relative w-full max-w-3xl group">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-[#ff6a00]/10 blur-2xl rounded-[2.5rem] opacity-50 group-hover:opacity-75 transition-opacity" />
            
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
              {ebook.video_url ? (
                <iframe
                  src={ebook.video_url}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                  <Play className="h-16 w-16 mb-4 opacity-20" />
                  <span className="text-sm font-bold uppercase tracking-widest">Vídeo em breve</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center max-w-2xl">
            <p className="text-white/60 leading-relaxed line-clamp-2 mb-6">
              {ebook.description || "Inicie sua jornada agora mesmo com este material exclusivo."}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-3 w-3" />
                <span>{modules.length} Módulos</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                <span>{chapters.length} Capítulos</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>~{totalMinutes} min total</span>
              </div>
            </div>
          </div>
        </section>

        {/* Módulos e Capítulos */}
        <section className="max-w-3xl mx-auto">
          {isLoadingModules || isLoadingChapters ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible defaultValue={modules[0]?.id} className="space-y-4">
              {modules.map((module, mIdx) => {
                const moduleChapters = chapters.filter(c => c.module_id === module.id);
                const moduleCompleted = moduleChapters.filter(c => progress.find(p => p.chapter_id === c.id)?.completed_at).length;
                const moduleProgress = moduleChapters.length > 0 ? (moduleCompleted / moduleChapters.length) * 100 : 0;
                const moduleMinutes = moduleChapters.reduce((acc, curr) => acc + (curr.reading_minutes || 0), 0);

                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: mIdx * 0.04, duration: 0.25 }}
                  >
                    <AccordionItem value={module.id} className="border-none bg-white/5 rounded-2xl overflow-hidden px-4 transition-colors hover:bg-white/[0.07]">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex items-center gap-4 text-left w-full mr-4">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/20 flex items-center justify-center text-[#ff6a00] font-bold text-sm">
                            {mIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white mb-1 truncate">{module.title}</h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                              {moduleChapters.length} capítulos · {moduleMinutes} min
                            </p>
                          </div>
                          <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 mr-2">
                            <span className="text-[9px] font-black text-[#ff6a00] uppercase">{Math.round(moduleProgress)}%</span>
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#ff6a00]" style={{ width: `${moduleProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="space-y-1">
                          {moduleChapters.map((chapter, cIdx) => {
                            const p = progress.find(pg => pg.chapter_id === chapter.id);
                            const isCompleted = !!p?.completed_at;
                            const isStarted = !!p && !p.completed_at;

                            return (
                              <Link
                                key={chapter.id}
                                to="/app/ebooks/$ebookId/capitulo/$chapterSlug"
                                params={{ ebookId: ebook.id, chapterSlug: chapter.slug || chapter.id }}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-xl transition-all group",
                                  isCompleted ? "opacity-60" : "hover:bg-white/5 hover:translate-x-1"
                                )}
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-[#ff6a00]" />
                                    ) : isStarted ? (
                                      <div className="h-5 w-5 rounded-full border-2 border-[#ff6a00] border-t-transparent animate-spin" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-white/20 group-hover:text-white/40" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white group-hover:text-[#ff6a00] transition-colors truncate">
                                      {chapter.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="h-3 w-3 text-white/20" />
                                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                        {chapter.reading_minutes || 5} min de leitura
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0" />
                              </Link>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                );
              })}
            </Accordion>
          )}
        </section>
      </main>
    </div>
  );
}

import { useState } from "react";
import { 
  Lock, 
  ShoppingCart, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Play,
  PlayCircle,
  Clock,
  Layout,
  Trophy,
  BarChart3,
  Flame,
  ChevronDown,
  ArrowUpRight
} from "lucide-react";

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: () => ({ 
    meta: [
      { title: "E-book Interativo — Espetinho na Veia" },
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
  const totalChapters = chapters.length;
  const overallProgress = totalChapters > 0 ? (completedCount / totalChapters) * 100 : 0;

  // Find next module
  const nextModule = modules.find(m => {
    const moduleChapters = chapters.filter(c => c.module_id === m.id);
    const completedModuleChapters = moduleChapters.filter(c => progress.some(p => p.chapter_id === c.id && p.completed_at));
    return completedModuleChapters.length < moduleChapters.length;
  }) || modules[modules.length - 1];

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
        <p className="mt-4 max-w-md text-white/60 font-sans">
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#ff6a00]/30 overflow-x-hidden pb-20">
      {/* 1. SEÇÃO HERO */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Abstract Background Flourish */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6a00] blur-[120px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gold blur-[100px] rounded-full" />
        </div>

        <div className="container max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 mb-12"
          >
            <span className="font-display text-2xl font-black tracking-tighter text-white uppercase">Espetinho</span>
            <span className="font-display text-2xl font-black tracking-tighter text-[#ff6a00] uppercase">Na Veia</span>
          </motion.div>

          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="inline-block text-[11px] font-black uppercase tracking-[0.3em] text-[#ff6a00] mb-4"
          >
            E-book Interativo
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight leading-[0.9] mb-6 max-w-4xl"
          >
            Do zero aos 10k
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            className="text-white/60 text-lg md:text-xl max-w-2xl mb-12 font-medium"
          >
            O primeiro passo para transformar sua ideia de vender espetinhos em um negócio.
          </motion.p>

          {/* Player de Vídeo CENTRALIZADO */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.25 }}
            className="w-full max-w-3xl aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            
            {ebook.video_url ? (
              <iframe
                src={ebook.video_url}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <video 
                controls 
                playsInline 
                poster={ebook.cover_url || ""}
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/welcome-ronnei.mp4" type="video/mp4" />
                Seu navegador não suporta vídeo.
              </video>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center gap-2 text-white/40"
          >
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#ff6a00]" />
              Boas-vindas do Ronnei
            </span>
          </motion.div>
        </div>
      </section>

      {/* 2. SEÇÃO BARRA DE ESTATÍSTICAS */}
      <section className="bg-white/5 border-y border-white/5 py-12 mb-20">
        <div className="container max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <span className="font-display text-5xl font-black text-white mb-2">{totalChapters}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Capítulos</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center border-y md:border-y-0 md:border-x border-white/5 py-8 md:py-0"
          >
            <span className="font-display text-5xl font-black text-white mb-2">{completedCount}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Concluídos</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <span className="font-display text-5xl font-black text-[#ff6a00] mb-2">{Math.round(overallProgress)}%</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Progresso</span>
          </motion.div>
        </div>
      </section>

      {/* 3. SEÇÃO PROGRESSO DA JORNADA */}
      <section className="container max-w-5xl mx-auto px-6 mb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Progresso da sua jornada</h2>
          <span className="font-display text-2xl font-black text-[#ff6a00]">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${overallProgress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#ff6a00] to-gold rounded-full"
          />
        </div>
      </section>

      {/* 4. SEÇÃO TRILHA DO MÉTODO */}
      <nav className="container max-w-5xl mx-auto px-6 mb-32" aria-label="Trilha do método">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">Trilha do método</h2>
          <span className="font-display text-xl font-black text-white/20">
            {modules.filter(m => {
              const moduleChapters = chapters.filter(c => c.module_id === m.id);
              return moduleChapters.length > 0 && moduleChapters.every(c => progress.some(p => p.chapter_id === c.id && p.completed_at));
            }).length}/{modules.length}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {isLoadingModules || isLoadingChapters ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl bg-white/5" />
            ))
          ) : (
            modules.map((module, index) => {
              const isNext = module.id === nextModule?.id;
              const moduleChapters = chapters.filter(c => c.module_id === module.id);
              const isCompleted = moduleChapters.length > 0 && moduleChapters.every(c => 
                progress.some(p => p.chapter_id === c.id && p.completed_at)
              );
              
              const formattedIndex = (index + 1).toString().padStart(2, '0');

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.06, duration: 0.25 }}
                >
                  <div
                    className={cn(
                      "group relative flex items-center gap-6 p-6 md:p-8 rounded-[2rem] border transition-all duration-200",
                      isCompleted 
                        ? "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100" 
                        : isNext 
                          ? "bg-white/5 border-[#ff6a00]/30 hover:border-[#ff6a00]/60 ring-1 ring-[#ff6a00]/10 hover:translate-x-1" 
                          : "bg-white/5 border-white/5 hover:border-white/20 hover:translate-x-1",
                    )}
                    aria-current={isNext ? "step" : undefined}
                  >
                    {/* Número */}
                    <div className="hidden md:flex flex-shrink-0 font-display text-5xl font-black text-white/10 group-hover:text-[#ff6a00]/20 transition-colors">
                      {formattedIndex}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Módulo {index + 1}</span>
                        {isNext && (
                          <span className="px-2 py-0.5 rounded-full bg-[#ff6a00] text-black text-[9px] font-black uppercase tracking-widest animate-pulse">
                            próximo
                          </span>
                        )}
                      </div>
                      
                      {/* Título do Módulo */}
                      <h3 className="font-display text-xl md:text-2xl font-black text-white mb-4 group-hover:text-white transition-colors">
                        {module.title}
                      </h3>

                      {/* Lista de Capítulos Clicáveis */}
                      <div className="flex flex-col gap-2">
                        {moduleChapters.map((chapter) => {
                          const chapterProgress = progress.find(p => p.chapter_id === chapter.id);
                          const isChapterCompleted = !!chapterProgress?.completed_at;

                          return (
                            <Link
                              key={chapter.id}
                              to="/app/ebooks/$ebookId/capitulo/$chapterSlug"
                              params={{ 
                                ebookId: ebook.id, 
                                chapterSlug: chapter.slug || chapter.id 
                              }}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group/chapter",
                                isChapterCompleted 
                                  ? "bg-[#ff6a00]/5 border-[#ff6a00]/20 opacity-70 hover:opacity-100" 
                                  : "bg-white/[0.03] border-white/5 hover:border-[#ff6a00]/30 hover:bg-[#ff6a00]/5"
                              )}
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  isChapterCompleted ? "bg-[#ff6a00]" : "bg-white/20"
                                )} />
                                <span className={cn(
                                  "text-sm font-bold truncate transition-colors",
                                  isChapterCompleted ? "text-[#ff6a00]" : "text-white/60 group-hover/chapter:text-white"
                                )}>
                                  {chapter.title}
                                </span>
                              </div>
                              <ArrowUpRight className={cn(
                                "h-4 w-4 flex-shrink-0 transition-all duration-200",
                                isChapterCompleted ? "text-[#ff6a00]" : "text-white/20 group-hover/chapter:text-[#ff6a00] group-hover/chapter:translate-x-0.5 group-hover/chapter:-translate-y-0.5"
                              )} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full border border-white/5 bg-white/[0.03] group-hover:border-[#ff6a00]/30 transition-colors">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-[#ff6a00]" />
                      ) : isNext ? (
                        <Play className="h-5 w-5 text-[#ff6a00] fill-[#ff6a00]" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-white/20" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </nav>

      {/* 5. RODAPÉ */}
      <footer className="container max-w-5xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">
          Espetinho na Veia · do zero aos 10k
        </p>
      </footer>
    </div>
  );
}

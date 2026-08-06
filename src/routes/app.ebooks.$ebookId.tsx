import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  ShoppingCart, 
  Loader2, 
  Sparkles, 
  LayoutTemplate, 
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Menu,
  BookOpen
} from "lucide-react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: () => ({ 
    meta: [
      { title: "Leitor de E-book — Espetinho na Veia" },
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
  component: EbookReader,
});

function EbookReader() {
  const { ebook } = Route.useLoaderData();
  const { ebookId } = Route.useParams();
  const { user } = useAuth();
  const { isEnrolledInEbook, isLoading: isLoadingEnrollments } = useEnrollments();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createPaymentLink = useServerFn(createAsaasPaymentLink);

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

  // Last read logic
  useEffect(() => {
    if (!activeChapterId && chapters.length > 0) {
      const lastRead = progress.sort((a, b) => 
        new Date(b.last_read_at || 0).getTime() - new Date(a.last_read_at || 0).getTime()
      )[0];
      
      if (lastRead) {
        setActiveChapterId(lastRead.chapter_id);
      } else {
        setActiveChapterId(chapters[0].id);
      }
    }
  }, [chapters, progress, activeChapterId]);

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ chapterId, completed }: { chapterId: string, completed?: boolean }) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("ebook_progress")
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          last_read_at: new Date().toISOString(),
          ...(completed ? { completed_at: new Date().toISOString() } : {})
        }, { onConflict: 'user_id,chapter_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebook-progress", ebookId] });
    }
  });

  // Navigation logic
  const activeIndex = chapters.findIndex(c => c.id === activeChapterId);
  const activeChapter = chapters[activeIndex];
  const nextChapter = chapters[activeIndex + 1];
  const prevChapter = chapters[activeIndex - 1];

  const handleNext = () => {
    if (nextChapter) {
      updateProgressMutation.mutate({ chapterId: activeChapterId!, completed: true });
      setActiveChapterId(nextChapter.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (prevChapter) {
      setActiveChapterId(prevChapter.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, chapters]);

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

  if (isLoadingEnrollments || isLoadingChapters) {
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

  const completedCount = progress.filter(p => p.completed_at).length;
  const overallProgress = chapters.length > 0 ? (completedCount / chapters.length) * 100 : 0;

  const ChapterList = () => (
    <nav aria-label="Índice do e-book" className="flex flex-col gap-1 p-4">
      {chapters.map((chapter, idx) => {
        const isCompleted = progress.find(p => p.chapter_id === chapter.id)?.completed_at;
        const isActive = activeChapterId === chapter.id;
        
        return (
          <button
            key={chapter.id}
            onClick={() => {
              setActiveChapterId(chapter.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
              isActive 
                ? "bg-[#ff6a00]/10 border border-[#ff6a00]/20 shadow-sm" 
                : "hover:bg-white/5 border border-transparent"
            )}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-[#ff6a00]" />
              ) : (
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold",
                  isActive ? "border-[#ff6a00] text-[#ff6a00]" : "border-white/20 text-white/20"
                )}>
                  {idx + 1}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium leading-tight truncate",
                isActive ? "text-white" : "text-white/60 group-hover:text-white/80"
              )}>
                {chapter.title}
              </p>
              {chapter.reading_minutes && (
                <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider font-bold">
                  {chapter.reading_minutes} min de leitura
                </p>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/app/ebooks" className="p-2 hover:bg-white/5 rounded-full transition text-white/60 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold truncate max-w-[200px] lg:max-w-md">{ebook.title}</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                {activeIndex + 1} de {chapters.length} capítulos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end gap-1.5 w-48">
              <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-widest">
                <span className="text-white/40">Progresso</span>
                <span className="text-[#ff6a00]">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-1 bg-white/5" />
            </div>

            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition">
                    <Menu className="h-4 w-4" />
                    <span>Capítulos</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0 bg-[#0a0a0a] border-l border-white/10">
                  <SheetHeader className="p-6 border-b border-white/5">
                    <SheetTitle className="text-white text-left font-display uppercase tracking-widest text-sm">Índice do E-book</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
                    <ChapterList />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        {/* Mobile Progress Bar */}
        <div className="lg:hidden h-0.5 w-full bg-white/5">
          <motion.div 
            className="h-full bg-[#ff6a00]" 
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
          />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[320px] border-r border-white/5 sticky top-16 h-[calc(100dvh-64px)] overflow-y-auto scrollbar-hidden bg-[#0a0a0a]">
          <ChapterList />
        </aside>

        {/* Reading Area */}
        <main className="flex-1 px-6 py-12 lg:px-20 lg:py-16 overflow-x-hidden">
          <div className="max-w-[68ch] mx-auto">
            <AnimatePresence mode="wait">
              {activeChapter ? (
                <motion.article
                  key={activeChapter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="prose prose-invert prose-orange max-w-none"
                >
                  {/* Video Player */}
                  {activeChapter.video_url && (
                    <div className="mb-12 space-y-4">
                      <div className="flex items-center gap-2 text-[#ff6a00]">
                        <PlayCircle className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Aula em vídeo</span>
                      </div>
                      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                        <iframe
                          src={activeChapter.video_url}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  <header className="mb-10">
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
                      {activeChapter.title}
                    </h2>
                    <div className="h-1 w-20 bg-[#ff6a00] rounded-full" />
                  </header>

                  <div className="text-[17px] leading-[1.8] text-white/80 whitespace-pre-wrap font-sans">
                    {activeChapter.content || "Carregando conteúdo..."}
                  </div>

                  {/* Navigation Footer */}
                  <footer className="mt-20 pt-10 border-t border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {prevChapter ? (
                        <button 
                          onClick={handlePrev}
                          className="flex flex-col items-start gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition group text-left"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-[#ff6a00]">Anterior</span>
                          <span className="font-bold text-white line-clamp-1">{prevChapter.title}</span>
                        </button>
                      ) : <div />}

                      {nextChapter ? (
                        <button 
                          onClick={handleNext}
                          className="flex flex-col items-end gap-2 p-6 rounded-2xl bg-[#ff6a00]/5 border border-[#ff6a00]/20 hover:bg-[#ff6a00]/10 transition group text-right"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00]">Próximo Capítulo</span>
                          <span className="font-bold text-white line-clamp-1">{nextChapter.title}</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-4 p-8 rounded-2xl bg-gradient-to-br from-[#ff6a00]/20 to-transparent border border-[#ff6a00]/30 text-right">
                          <CheckCircle2 className="h-8 w-8 text-[#ff6a00]" />
                          <div>
                            <h3 className="font-bold text-lg">Você concluiu a leitura!</h3>
                            <p className="text-sm text-white/60">Parabéns por finalizar este material.</p>
                          </div>
                          <Link to="/app/ebooks" className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] hover:underline">
                            Voltar à biblioteca
                          </Link>
                        </div>
                      )}
                    </div>

                    {nextChapter && (
                      <button
                        onClick={handleNext}
                        className="w-full mt-6 py-4 rounded-xl bg-[#ff6a00] text-white font-bold hover:brightness-110 transition shadow-lg shadow-[#ff6a00]/20 flex items-center justify-center gap-2"
                      >
                        Marcar como concluído e continuar
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    )}
                  </footer>
                </motion.article>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[#ff6a00]" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Preparando sua leitura...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Trophy,
  ArrowUpRight
} from "lucide-react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ebooks/$ebookId/capitulo/$chapterSlug")({
  head: () => ({ 
    meta: [
      { title: "Leitura de E-book — Espetinho na Veia" }
    ] 
  }),
  loader: async ({ params }) => {
    // We try to find by slug or by ID
    const { data: chapter, error } = await supabase
      .from("ebook_chapters")
      .select("*, ebook:ebooks(*)")
      .or(`slug.eq."${params.chapterSlug}",id.eq."${params.chapterSlug}"`)
      .eq("ebook_id", params.ebookId)
      .single();

    if (error || !chapter) throw notFound();
    return { chapter };
  },
  component: ChapterReadingPage,
});

function ChapterReadingPage() {
  const { chapter } = Route.useLoaderData();
  const { ebookId, chapterSlug } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch all chapters to handle navigation
  const { data: allChapters = [] } = useQuery({
    queryKey: ["ebook-chapters", ebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_chapters")
        .select("id, title, slug, order_index")
        .eq("ebook_id", ebookId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch progress
  const { data: progress = [] } = useQuery({
    queryKey: ["ebook-progress", ebookId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("ebook_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const currentIndex = allChapters.findIndex(c => c.id === chapter.id || c.slug === chapterSlug);
  const prevChapter = allChapters[currentIndex - 1];
  const nextChapter = allChapters[currentIndex + 1];
  const isLastChapter = currentIndex === allChapters.length - 1;

  const currentProgress = progress.find(p => p.chapter_id === chapter.id);
  const isCompleted = !!currentProgress?.completed_at;

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

  const handleCompleteAndNext = async () => {
    try {
      await updateProgressMutation.mutateAsync({ chapterId: chapter.id, completed: true });
      if (nextChapter) {
        navigate({ 
          to: "/app/ebooks/$ebookId/capitulo/$chapterSlug", 
          params: { ebookId, chapterSlug: nextChapter.slug || nextChapter.id } 
        });
        window.scrollTo(0, 0);
      } else {
        toast.success("Parabéns! Você concluiu o e-book.");
      }
    } catch (error) {
      toast.error("Erro ao salvar progresso.");
    }
  };

  const isEbookFinished = progress.filter(p => p.completed_at).length >= allChapters.length && isLastChapter;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Header Compacto */}
      <header className="sticky top-0 z-50 w-full h-14 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 max-w-4xl mx-auto w-full">
          <Link 
            to="/app/ebooks/$ebookId" 
            params={{ ebookId }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/40 hover:text-[#ff6a00] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Voltar ao índice</span>
          </Link>

          <div className="hidden sm:block text-center min-w-0 px-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ff6a00] mb-0.5">Lendo Agora</p>
            <h1 className="text-xs font-bold truncate text-white/60">{chapter.title}</h1>
          </div>

          <div className="w-20 sm:w-24 text-right">
            <span className="text-[10px] font-black text-white/20">
              {currentIndex + 1} / {allChapters.length}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 lg:py-16">
        <article className="max-w-[68ch] mx-auto">
          {/* Vídeo do Capítulo */}
          {chapter.video_url && (
            <section className="mb-12">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl group">
                <iframe
                  src={chapter.video_url}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-2 mt-4 text-[#ff6a00]">
                <PlayCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Vídeo de apoio</span>
              </div>
            </section>
          )}

          <header className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-6 leading-tight">
              {chapter.title}
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-[#ff6a00] to-transparent rounded-full" />
          </header>

          <section 
            className="prose prose-invert prose-orange max-w-none text-[17px] leading-[1.8] text-white/80 font-sans whitespace-pre-wrap"
          >
            {chapter.content || "Nenhum conteúdo disponível para este capítulo."}
          </section>

          {/* Card de Conclusão Final */}
          <AnimatePresence>
            {isEbookFinished && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-20 p-10 rounded-3xl bg-gradient-to-br from-[#ff6a00]/20 via-white/[0.02] to-transparent border border-[#ff6a00]/30 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy className="h-24 w-24" />
                </div>
                
                <div className="relative z-10">
                  <div className="h-16 w-16 bg-[#ff6a00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#ff6a00]/20">
                    <Trophy className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Você concluiu a leitura!</h3>
                  <p className="text-white/60 text-sm max-w-md mx-auto mb-8">
                    Parabéns por finalizar todo o material do e-book **{chapter.ebook?.title}**. Continue aplicando o conhecimento para ter sucesso!
                  </p>
                  <Link 
                    to="/app/ebooks"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Voltar à biblioteca
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Rodapé de Navegação */}
          <footer className="mt-20 pt-10 border-t border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {prevChapter ? (
                <Link 
                  to="/app/ebooks/$ebookId/capitulo/$chapterSlug"
                  params={{ ebookId, chapterSlug: prevChapter.slug || prevChapter.id }}
                  onClick={() => window.scrollTo(0, 0)}
                  className="flex flex-col items-start gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition group text-left"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-[#ff6a00]">Anterior</span>
                  <span className="font-bold text-white group-hover:text-white truncate w-full">{prevChapter.title}</span>
                </Link>
              ) : <div />}

              {nextChapter ? (
                <Link 
                  to="/app/ebooks/$ebookId/capitulo/$chapterSlug"
                  params={{ ebookId, chapterSlug: nextChapter.slug || nextChapter.id }}
                  onClick={() => window.scrollTo(0, 0)}
                  className="flex flex-col items-end gap-2 p-6 rounded-2xl bg-[#ff6a00]/5 border border-[#ff6a00]/20 hover:bg-[#ff6a00]/10 transition group text-right"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#ff6a00]">Próximo Capítulo</span>
                  <span className="font-bold text-white group-hover:text-white truncate w-full">{nextChapter.title}</span>
                </Link>
              ) : <div />}
            </div>

            {nextChapter ? (
              <button
                onClick={handleCompleteAndNext}
                disabled={updateProgressMutation.isPending}
                className="w-full py-5 rounded-2xl bg-[#ff6a00] text-black font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-[#ff6a00]/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {updateProgressMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Concluir e continuar
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : !isCompleted ? (
              <button
                onClick={() => updateProgressMutation.mutate({ chapterId: chapter.id, completed: true })}
                disabled={updateProgressMutation.isPending}
                className="w-full py-5 rounded-2xl bg-[#ff6a00] text-black font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-[#ff6a00]/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {updateProgressMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Marcar como concluído
              </button>
            ) : null}
          </footer>
        </article>
      </main>
    </div>
  );
}

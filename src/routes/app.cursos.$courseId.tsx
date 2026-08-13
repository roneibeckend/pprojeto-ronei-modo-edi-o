import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, Suspense, lazy, useRef, useLayoutEffect } from "react";
import { Check, Lock, Play, ChevronLeft, ChevronRight, FileText, StickyNote, Loader2, ShoppingCart, CheckCircle2, ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { getAffiliateRef } from "@/hooks/use-affiliate-tracking";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgress } from "@/hooks/use-progress";
import { usePaymentModal } from "@/hooks/use-payment-modal";
import { FeedbackModal } from "@/components/platform/FeedbackModal";
import { FeedbackSummary } from "@/components/platform/FeedbackSummary";
import { PostPurchaseOffer } from "@/components/platform/PostPurchaseOffer";
import { usePostPurchaseOfferStore } from "@/hooks/use-post-purchase-offer";
import { getSignedVideoUrl } from "@/lib/video.functions";
import { motion } from "framer-motion";



const VideoPlayer = lazy(() => import("@/components/platform/VideoPlayer").then(m => ({ default: m.VideoPlayer })));


export const Route = createFileRoute("/app/cursos/$courseId")({
  head: ({ params }) => {
    return {
      meta: [
        { title: "Curso — Espetinho na Veia" },
      ],
    };
  },
  loader: async ({ params }) => {
    const { data: course, error } = await supabase
      .from("courses")
      .select(`
        id, title, description, price, teacher_name, cover_url, payment_type, due_days,
        modules (
          id, title, video_url, order_index,
          lessons (id, title, video_url, duration, order_index, module_id)
        )
      `)
      .eq("id", params.courseId)
      .single();


    if (error || !course) throw notFound();
    return { course };
  },
  component: CoursePage,
});

function CoursePage() {
  const data = Route.useLoaderData() as { course: any };
  const course = data?.course;
  const navigate = useNavigate();
  const { isEnrolledInCourse, isLoading: isLoadingEnrollments } = useEnrollments();
  const { isLessonCompleted, toggleLessonProgress, isTogglingLesson } = useProgress();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const { isEnabled: isOfferEnabled, syncWithDatabase } = usePostPurchaseOfferStore();

  const readerRef = useRef<HTMLDivElement>(null);
  const lessonTopRef = useRef<HTMLDivElement>(null);
  
  useState(() => {
    syncWithDatabase();
  });
  const createPaymentLink = useServerFn(createAsaasPaymentLink);
  const { openPayment } = usePaymentModal();
  const getSignedUrl = useServerFn(getSignedVideoUrl);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [signedLessonUrl, setSignedLessonUrl] = useState<string | null>(null);

  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);


  const handlePurchase = async () => {
    if (isOfferEnabled) {
      const { data } = await supabase.from('integrations').select('status').eq('category', 'offer_settings').maybeSingle();
      if (data && data.status === false) {
        await executeCheckout([]);
        return;
      }
      setShowOffer(true);
      return;
    }
    await executeCheckout([]);
  };

  const executeCheckout = async (additionalItems: any[]) => {
    try {
      setIsProcessing(true);
      
      const products = [
        {
          productId: course.id,
          productType: 'course' as const,
          title: course.title,
          description: course.description,
          value: course.price || 0,
        },
        ...additionalItems.map(off => ({
          productId: off.id,
          productType: off.type,
          title: off.title,
          description: off.description,
          value: (off.price || 0) * (1 - (15 / 100)), 
        }))
      ];

      const { data: config } = await supabase.from('integrations').select('settings').eq('category', 'offer_settings').maybeSingle();
      const settings = config?.settings as any;
      const discount = settings?.discountPercentage || 15;

      products.forEach((p, i) => {
        if (i > 0) {
          const originalItem = additionalItems[i-1];
          p.value = (originalItem.price || 0) * (1 - (discount / 100));
        }
      });

      const result = await createPaymentLink({
        data: {
          products,
          affiliateRef: getAffiliateRef() || undefined,
          paymentType: course.payment_type || 'unique',
          dueDays: course.due_days || 3,
        }
      });
      
      if (result.url) {
        openPayment(result.url, course.title, course.id, 'course');
      }
    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      toast.error(error.message || "Erro ao gerar link de pagamento.");
    } finally {
      setIsProcessing(false);
      setShowOffer(false);
    }
  };

  if (!course) return null;

  const isFree = (course.price || 0) === 0;
  const isEnrolled = isEnrolledInCourse(course.id);
  const hasAccess = isFree || isEnrolled;

  const flat = course.modules?.flatMap((m: any) => m.lessons || []) || [];
  const completedCount = flat.filter((l: any) => isLessonCompleted(l.id)).length;
  const isCompleted = flat.length > 0 && completedCount === flat.length;

  useEffect(() => {
    if (isCompleted && !hasSubmittedFeedback) {
      // Check if user already submitted feedback via DB to be sure
      const checkFeedback = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from("course_feedback")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .maybeSingle();
        
        if (data) {
          setHasSubmittedFeedback(true);
        } else {
          setShowFeedbackModal(true);
        }
      };
      checkFeedback();
    }
  }, [isCompleted, hasSubmittedFeedback, course.id]);

  useEffect(() => {
    if (!isLoadingEnrollments && !hasAccess) {
      // Se não tem acesso, não redirecionamos bruscamente, apenas mostramos o estado bloqueado na UI
    }
  }, [hasAccess, isLoadingEnrollments]);


  // Se não tem acesso, mostra tela de compra
  if (!isLoadingEnrollments && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PostPurchaseOffer
          isOpen={showOffer}
          onClose={() => setShowOffer(false)}
          onProceedWithOffers={(selected) => executeCheckout(selected)}
          onProceedWithoutOffers={() => executeCheckout([])}
          originalProductId={course.id}
        />
        <div className="mb-6 rounded-full bg-white/5 p-8 text-gold">
          <Lock className="h-16 w-16" />
        </div>
        <h2 className="font-display text-3xl font-black">{course.title}</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Este conteúdo é exclusivo para alunos deste treinamento. Adquira agora para liberar o acesso imediato.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link to="/app/cursos" className="btn-ghost-fire px-8 py-3 font-bold">
            Voltar aos cursos
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
            {isProcessing ? "Processando..." : `Comprar por R$ ${course.price?.toString().replace(".", ",")}`}
          </button>
        </div>
      </div>
    );
  }

  // Lógica normal do curso
  // const flat defined above
  const [activeId, setActiveId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const lastWatched = localStorage.getItem(`course_last_watched_${course.id}`);
    if (lastWatched && flat.some((l: any) => l.id === lastWatched)) {
      return lastWatched;
    }
    return flat.length > 0 ? flat[0].id : undefined;
  });

  // Prefetch next lesson video
  useEffect(() => {
    if (!activeId || !flat.length) return;
    
    const currentIndex = flat.findIndex((l: any) => l.id === activeId);
    const nextLesson = flat[currentIndex + 1];
    
    if (nextLesson?.video_url && !nextLesson.video_url.includes('youtube') && !nextLesson.video_url.includes('drive')) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = nextLesson.video_url;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [activeId, flat]);

  useEffect(() => {
    const activeLesson = flat.find((l: any) => l.id === activeId);
    if (activeLesson?.video_url && !activeLesson.video_url.includes('youtube') && !activeLesson.video_url.includes('drive')) {
      const loadSignedUrl = async () => {
        try {
          const result = await getSignedUrl({ data: { path: activeLesson.video_url } });
          setSignedLessonUrl(result.signedUrl);
        } catch (error) {
          console.error("Failed to sign lesson video URL:", error);
          setSignedLessonUrl(null);
        }
      };
      loadSignedUrl();
    } else {
      setSignedLessonUrl(null);
    }
  }, [activeId, flat, getSignedUrl]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(`course_last_watched_${course.id}`, activeId);
    }
  }, [activeId, course.id]);

  // Scroll to top when lesson changes (all devices)
  useLayoutEffect(() => {
    if (activeId) {
      const scrollContainer = readerRef.current?.closest('main');
      
      const scrollToTop = () => {
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
        
        if (lessonTopRef.current) {
          lessonTopRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
        }
      };

      scrollToTop();
      const rafId = requestAnimationFrame(scrollToTop);
      return () => cancelAnimationFrame(rafId);
    }
  }, [activeId]);





  const [tab, setTab] = useState<"materiais" | "anotacoes">("materiais");
  const [note, setNote] = useState("");

  const active = flat.find((l: any) => l.id === activeId) ?? flat[0];
  const nextLessonForPrefetch = flat.findIndex((l: any) => l.id === active?.id) + 1;
  const next = nextLessonForPrefetch < flat.length ? flat[nextLessonForPrefetch] : null;
  const prev = (flat.findIndex((l: any) => l.id === active?.id) || 0) > 0 ? flat[flat.findIndex((l: any) => l.id === active?.id) - 1] : null;


  if (isLoadingEnrollments) {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="aspect-[9/16] max-h-[600px] w-full max-w-[340px] mx-auto rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }


  if (!active) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <h2 className="font-display text-xl font-bold">Este curso ainda não possui aulas cadastradas.</h2>
        <Link to="/app/cursos" className="btn-fire mt-4 inline-flex">Voltar aos cursos</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-0 sm:px-4">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8 sm:px-0">
        <div>
          <div className="mb-4">
            <FeedbackSummary courseId={course.id} />
          </div>
          <PageHeader
            title={course.title}
            subtitle={`Professor: ${course.teacher_name || "Equipe Espetinho na Veia"}`}
          />
        </div>
        <Link to="/app/cursos" className="btn-ghost-fire text-xs sm:text-sm w-full sm:w-auto h-12 sm:h-auto py-3 sm:py-4">← Todos os cursos</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player */}
        <div className="min-w-0 space-y-4">
          <motion.div 
            ref={readerRef}
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="overflow-hidden rounded-none sm:rounded-2xl bg-black/20 min-h-[400px]"
          >
            <div ref={lessonTopRef} className="scroll-mt-24" />
            <Suspense fallback={<div className="aspect-[9/16] max-h-[70vh] w-full max-w-[400px] mx-auto rounded-2xl bg-white/5 animate-pulse" />}>
              <VideoPlayer
                videoId={active.id}
                src={signedLessonUrl || active.video_url || ""}
                poster={course.cover_url || ""}
                title={active.title}
                className="w-full"
              />
            </Suspense>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 glass border-t-0 rounded-t-none">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Aula atual</div>
                <div className="font-display text-base sm:text-lg font-bold break-words">{active.title}</div>
              </div>
              <button 
                onClick={() => toggleLessonProgress({ 
                  lessonId: active.id, 
                  completed: !isLessonCompleted(active.id),
                  moduleId: active.module_id,
                  courseId: course.id
                })}
                disabled={isTogglingLesson}
                className={`btn-fire text-xs sm:text-sm touch-target flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-4 h-12 sm:h-auto ${isLessonCompleted(active.id) ? 'bg-green-600 shadow-green-600/20' : ''}`}
              >
                {isTogglingLesson ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLessonCompleted(active.id) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isLessonCompleted(active.id) ? "Concluída" : "Marcar como concluída"}
              </button>
            </div>
          </motion.div>

          <div className="flex items-center justify-between gap-3 px-4 sm:px-0">
            <button
              disabled={!prev}
              onClick={() => prev && setActiveId(prev.id)}
              className="btn-ghost-fire text-xs sm:text-sm disabled:opacity-40 flex-1 sm:flex-none h-10 sm:h-auto"
            >
              <ChevronLeft className="h-4 w-4" /> Aula anterior
            </button>
            <button
              disabled={!next}
              onClick={() => next && setActiveId(next.id)}
              className="btn-ghost-fire text-xs sm:text-sm disabled:opacity-40 flex-1 sm:flex-none h-10 sm:h-auto"
            >
              Próxima aula <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="glass rounded-none sm:rounded-2xl p-6 sm:p-5">
            <div className="mb-4 flex overflow-x-auto pb-2 gap-2 scrollbar-hidden">
              <div className="flex min-w-max">
                <button
                  onClick={() => setTab("materiais")}
                  className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition ${tab === "materiais" ? "bg-fire text-white shadow-lg shadow-fire/20" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <FileText className="mr-1.5 inline h-3.5 w-3.5" /> Materiais
                </button>
                <button
                  onClick={() => setTab("anotacoes")}
                  className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition ${tab === "anotacoes" ? "bg-fire text-white shadow-lg shadow-fire/20" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <StickyNote className="mr-1.5 inline h-3.5 w-3.5" /> Anotações
                </button>
              </div>
            </div>
            {tab === "materiais" ? (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                  <span>PDF · Guia rápido de temperos</span>
                  <button className="text-gold hover:underline">Baixar</button>
                </li>
              </ul>
            ) : (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anote os pontos importantes desta aula..."
                className="min-h-40 w-full rounded-lg border border-white/10 bg-secondary/50 p-3 text-sm outline-none focus:border-primary text-[16px] md:text-sm"
              />
            )}
          </div>
        </div>

        {/* Modules */}
        <aside className="glass rounded-none sm:rounded-2xl p-6 sm:p-4">
          <div className="mb-3 px-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Conteúdo do curso
          </div>
          <div className="space-y-4">
            {course.modules?.map((m: any) => (
              <div key={m.id} className="space-y-3">
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      if (m.lessons && m.lessons.length > 0) {
                        setActiveId(m.lessons[0].id);
                      }
                    }}
                    className="w-full text-left px-2 text-sm font-semibold hover:text-fire transition-colors break-words"
                  >
                    {m.title}
                  </button>
                  
                  {m.video_url && (
                    <div className="px-2">
                      <div className="relative aspect-[9/16] max-h-[300px] mx-auto rounded-lg overflow-hidden glass border border-white/5">
                        <Suspense fallback={<div className="w-full h-full bg-white/5 animate-pulse" />}>
                          <VideoPlayer
                            key={`module-${m.id}`}
                            videoId={`module-${m.id}`}
                            src={m.video_url}
                            title={`Intro: ${m.title}`}
                            isIntro={true}
                            className="w-full h-full scale-[1.01]"
                          />

                        </Suspense>
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-fire/90 text-[8px] font-bold uppercase tracking-wider text-white">
                          Intro
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <ul className="space-y-1">
                  {m.lessons?.map((l: any) => {
                    const isActive = l.id === active?.id;
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => setActiveId(l.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                            isActive ? "bg-fire/20 text-foreground" : "hover:bg-white/5"
                          }`}
                        >
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${isLessonCompleted(l.id) ? 'bg-green-600/20 border-green-600 text-green-500' : 'border-white/10'}`}>
                            {isLessonCompleted(l.id) ? <Check className="h-3 w-3" /> : (isActive ? <Play className="h-3 w-3" /> : <Play className="h-3 w-3 opacity-50" />)}
                          </span>
                          <span className="min-w-0 flex-1 whitespace-normal break-words">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{l.duration || "00:00"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <FeedbackModal
        courseId={course.id}
        itemTitle={course.title}
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setHasSubmittedFeedback(true);
        }}
      />
    </div>
  );
}


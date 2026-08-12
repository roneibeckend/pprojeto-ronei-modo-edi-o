import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles, Lock, ShoppingCart, Loader2 } from "lucide-react";
import { usePaymentModal } from "@/hooks/use-payment-modal";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { useServerFn } from "@tanstack/react-start";
import { getAffiliateRef } from "@/hooks/use-affiliate-tracking";
import { toast } from "sonner";
import { useState } from "react";
import { PageHeader } from "@/components/platform/Shell";
import { ProgressSummary } from "@/components/platform/ProgressSummary";
import { IMG } from "@/lib/platform-data";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { CourseCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/cursos/")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const { courseEnrollments, ebookEnrollments, isLoading: isLoadingEnrollments } = useEnrollments();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const createPaymentLink = useServerFn(createAsaasPaymentLink);
  const { openPayment } = usePaymentModal();

  const handlePurchase = async (item: any, type: 'course' | 'ebook') => {
    try {
      setProcessingId(item.id);
      const result = await createPaymentLink({
        data: {
          productId: item.id,
          productType: type,
          title: item.title,
          description: item.description,
          value: item.price || 0,
          affiliateRef: getAffiliateRef() || undefined,
          paymentType: item.payment_type || 'unique',
          dueDays: item.due_days || 3,
        }
      });
      
      if (result.url) {
        openPayment(result.url, item.title, item.id, type);
      }
    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      toast.error(error.message || "Erro ao gerar link de pagamento.");
    } finally {
      setProcessingId(null);
    }
  };
  
  const { data: dbCourses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: dbEbooks, isLoading: isLoadingEbooks } = useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (isLoadingCourses || isLoadingEnrollments || isLoadingEbooks) {
    return (
      <div className="pb-10 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>

        <section>
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }


  const ownedCourses = dbCourses?.filter((c) => courseEnrollments.includes(c.id) || c.price === 0) || [];
  const otherCourses = dbCourses?.filter((c) => !courseEnrollments.includes(c.id) && (c.price || 0) > 0) || [];
  
  const ownedEbooks = dbEbooks?.filter((e) => ebookEnrollments.includes(e.id) || (e.price || 0) === 0) || [];
  const otherEbooks = dbEbooks?.filter((e) => !ebookEnrollments.includes(e.id) && (e.price || 0) > 0) || [];

  const totalProgress = ownedCourses.length > 0 ? 0 : 0;

  return (
    <div className="pb-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
        <PageHeader
          title="Meus cursos"
          subtitle="Gerencie seus treinamentos e descubra novos conteúdos."
        />
        <Link to="/app/cursos/preview" className="btn-ghost-fire text-xs sm:text-sm w-full sm:w-auto mt-2 sm:mt-0 py-3 sm:py-4 h-12 sm:h-auto">
          <Sparkles className="h-4 w-4" /> Ver previews interativas
        </Link>
      </div>

      <ProgressSummary 
        totalProgress={totalProgress}
        startedCount={0}
        finishedCount={0}
        streak={0}
      />

      {/* Seção de Treinamentos (Cursos e E-books Adquiridos) */}
      <section className="mb-12">
        <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Seus Treinamentos
        </h2>
        
        {(ownedCourses.length > 0 || ownedEbooks.length > 0) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
            {/* Renderizar Cursos */}
            {ownedCourses.map((c) => (
              <article key={c.id} className="glass card-tilt group overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-fire/30">
                <div className="relative aspect-video bg-muted/20">
                  <img 
                    src={c.cover_url || IMG.hero} 
                    alt={c.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    loading="lazy" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = IMG.hero;
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  
                  {c.badge && (
                    <div className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                      <Sparkles className="mr-1 inline h-3 w-3" /> {c.badge}
                    </div>
                  )}
                </div>
                
                <div className="p-4 sm:p-5">
                  <h3 className="font-display text-base sm:text-lg font-bold leading-tight line-clamp-2">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs sm:text-sm text-muted-foreground">{c.description}</p>
                  
                  <Link
                    to="/app/cursos/$courseId"
                    params={{ courseId: c.id }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold bg-fire text-white shadow-lg shadow-fire/20 hover:brightness-110 transition-all"
                  >
                    <Play className="h-4 w-4 fill-current" /> 
                    Acessar curso
                  </Link>
                </div>
              </article>
            ))}

            {/* Renderizar E-books */}
            {ownedEbooks.map((e) => (
              <article key={e.id} className="glass card-tilt group overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-fire/30">
                <div className="relative aspect-video bg-muted/20">
                  <img 
                    src={e.cover_url || e.cover || IMG.hero} 
                    alt={e.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">E-book</span>
                  </div>
                  <h3 className="font-display text-lg font-bold leading-tight line-clamp-2">{e.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
                  
                  <Link
                    to="/app/ebooks/$ebookId"
                    params={{ ebookId: e.id }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border border-fire/50 text-fire hover:bg-fire/10 transition-all"
                  >
                    <Play className="h-4 w-4 fill-current" /> 
                    Ler e-book
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center text-muted-foreground">
            Você ainda não possui nenhum treinamento liberado.
          </div>
        )}
      </section>

      {/* Seção de Cursos Disponíveis para Compra */}
      {otherCourses.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Cursos Disponíveis
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {otherCourses.map((c) => (
              <article key={c.id} className="glass overflow-hidden rounded-2xl border border-white/5 opacity-80 transition-opacity hover:opacity-100">
                <div className="relative aspect-video bg-muted/20 grayscale-[0.3]">
                  <img 
                    src={c.cover_url || IMG.hero} 
                    alt={c.title} 
                    className="h-full w-full object-cover" 
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-3 text-gold backdrop-blur-md">
                      <Lock className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-tight line-clamp-2">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                  
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investimento</span>
                      <div className="font-display text-2xl font-bold text-gold">
                        R$ {c.price?.toString().replace(".", ",")}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePurchase(c, 'course')}
                    disabled={processingId === c.id}
                    className="btn-fire mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg shadow-fire/10 disabled:opacity-50"
                  >
                    {processingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    {processingId === c.id ? "Processando..." : "Comprar e Liberar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Seção de E-books Disponíveis para Compra */}
      {otherEbooks.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              E-books Disponíveis
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {otherEbooks.map((e) => (
              <article key={e.id} className="glass overflow-hidden rounded-2xl border border-white/5 opacity-80 transition-opacity hover:opacity-100">
                <div className="relative aspect-video bg-muted/20 grayscale-[0.3]">
                  <img 
                    src={e.cover_url || e.cover || IMG.hero} 
                    alt={e.title} 
                    className="h-full w-full object-cover" 
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-3 text-gold backdrop-blur-md">
                      <Lock className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-tight line-clamp-2">{e.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
                  
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investimento</span>
                      <div className="font-display text-2xl font-bold text-gold">
                        R$ {e.price?.toString().replace(".", ",")}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePurchase(e, 'ebook')}
                    disabled={processingId === e.id}
                    className="btn-ghost-fire mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg disabled:opacity-50"
                  >
                    {processingId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    {processingId === e.id ? "Processando..." : "Comprar e Liberar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

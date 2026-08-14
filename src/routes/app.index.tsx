import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, ShoppingCart, Sparkles, Lock, Loader2 } from "lucide-react";
import { usePaymentModal } from "@/hooks/use-payment-modal";
import { createAsaasPaymentLink } from "@/lib/asaas.functions";
import { useServerFn } from "@tanstack/react-start";
import { getAffiliateRef } from "@/hooks/use-affiliate-tracking";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { IMG } from "@/lib/platform-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { CourseCardSkeleton } from "@/components/ui/skeleton";
import { PostPurchaseOffer } from "@/components/platform/PostPurchaseOffer";
import { usePostPurchaseOfferStore } from "@/hooks/use-post-purchase-offer";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Início — Espetinho na Veia" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { isEnrolledInCourse, isEnrolledInEbook, isLoading: isLoadingEnrollments } = useEnrollments();
  const { syncWithDatabase } = usePostPurchaseOfferStore();

  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  const { data: showcaseItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ["showcase-items"],
    staleTime: 1000 * 60 * 5, // 5 minutos
    queryFn: async () => {
      const [coursesRes, ebooksRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title, description, price, cover_url, created_at, badge, is_locked, status")
          .eq("is_locked", false)
          .in("status", ["active", "published"])
          .limit(10),
        supabase
          .from("ebooks")
          .select("id, title, description, price, cover_url, created_at, badge, is_locked, status")
          .eq("is_locked", false)
          .in("status", ["active", "published"])
          .limit(10),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (ebooksRes.error) throw ebooksRes.error;

      const items = [
        ...(coursesRes.data || []).map(c => ({ 
          id: c.id,
          title: c.title,
          description: c.description,
          price: c.price,
          cover_url: c.cover_url,
          created_at: c.created_at,
          badge: c.badge,
          is_locked: c.is_locked,
          status: c.status,
          type: 'course' as const 
        })),
        ...(ebooksRes.data || []).map(e => ({ 
          id: e.id,
          title: e.title,
          description: e.description,
          price: e.price,
          cover_url: e.cover_url,
          created_at: e.created_at,
          badge: e.badge,
          is_locked: e.is_locked,
          status: e.status,
          type: 'ebook' as const 
        })),
      ];

      return items.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
    },
  });

  if (isLoadingItems || isLoadingEnrollments) {
    return (
      <div className="space-y-8">
        <section>
          <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Fallback para o primeiro item se não houver contexto anterior
  const lastItem = showcaseItems?.[0];



  return (
    <div className="space-y-8">
      {/* Showcase / Cursos */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight break-words">Novidades para você</h2>
          <Link to="/app/cursos" className="text-sm font-medium text-gold hover:underline">Ver todos</Link>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {showcaseItems
            ?.map(item => ({
              ...item,
              isEnrolled: item.type === 'course' 
                ? isEnrolledInCourse(item.id) || (item.price || 0) === 0
                : isEnrolledInEbook(item.id) || (item.price || 0) === 0
            }))
            .filter(item => !item.isEnrolled) // Oculta itens que o aluno já possui ou que são gratuitos
            .map((item) => (
              <CourseShowcaseCard 
                key={`${item.type}-${item.id}`} 
                item={item} 
                isEnrolled={item.isEnrolled} 
              />
            ))}
        </div>
      </section>
    </div>
  );
}

function CourseShowcaseCard({ item, isEnrolled }: { item: any; isEnrolled: boolean }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const { isEnabled: isOfferEnabled } = usePostPurchaseOfferStore();
  const createPaymentLink = useServerFn(createAsaasPaymentLink);
  const { openPayment } = usePaymentModal();
  
  const handlePurchase = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOfferEnabled) {
      // Fetch current discount for calculation consistency
      const { data } = await supabase.from('integrations').select('settings').eq('category', 'offer_settings').maybeSingle();
      if (data?.settings && typeof data.settings === 'object') {
        const s = data.settings as any;
        if (s.discountPercentage) setDiscountPercentage(s.discountPercentage);
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
          productId: item.id,
          productType: item.type,
          title: item.title,
          description: item.description,
          value: item.price || 0,
        },
        ...additionalItems.map(off => ({
          productId: off.id,
          productType: off.type,
          title: off.title,
          description: off.description,
          value: (off.price || 0) * (1 - (discountPercentage / 100)),
        }))
      ];

      const result = await createPaymentLink({
        data: {
          products,
          affiliateRef: getAffiliateRef() || undefined,
          paymentType: item.payment_type || 'unique',
          dueDays: item.due_days || 3,
        }
      });
      
      if (result.url) {
        openPayment(result.url, item.title, item.id, item.type);
      }
    } catch (error: any) {
      console.error("Erro ao processar compra:", error);
      toast.error(error.message || "Erro ao gerar link de pagamento.");
    } finally {
      setIsProcessing(false);
      setShowOffer(false);
    }
  };

  const isLocked = !isEnrolled;
  const linkTo = item.type === 'course' ? "/app/cursos/$courseId" : "/app/ebooks/$ebookId";
  const linkParams = item.type === 'course' ? { courseId: item.id } : { ebookId: item.id };
  
  return (
    <>
      <PostPurchaseOffer
        isOpen={showOffer}
        onClose={() => setShowOffer(false)}
        onProceedWithOffers={(selected) => executeCheckout(selected)}
        onProceedWithoutOffers={() => executeCheckout([])}
        originalProductId={item.id}
      />
      <article className={`glass overflow-hidden rounded-2xl transition-all duration-300 ${isLocked ? "opacity-90 grayscale-[0.3]" : "card-tilt shadow-lg"}`}>
      <div className="relative aspect-video bg-muted/20">
        <img 
          src={item.cover_url || IMG.hero} 
          alt={item.title} 
          className={`h-full w-full object-cover ${isLocked ? "blur-[1px] brightness-75" : ""}`} 
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = IMG.hero;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        
        {item.badge && !isLocked && (
          <div className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
            <Sparkles className="mr-1 inline h-3 w-3" /> {item.badge}
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-black/60 border border-white/20">
              <Lock className="h-5 w-5 text-gold" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-display text-base sm:text-lg font-bold line-clamp-2 break-words">{item.title}</h3>
        <p className="mt-1 line-clamp-3 text-xs sm:text-sm text-muted-foreground min-h-[48px] sm:min-h-[60px] break-words">{item.description}</p>
        
        {isLocked ? (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Acesso imediato</span>
                <div className="font-display text-xl font-bold text-gold">R$ {item.price?.toString().replace(".", ",")}</div>
              </div>
              <button 
                onClick={handlePurchase}
                disabled={isProcessing}
                className="btn-fire px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                {isProcessing ? "..." : "Comprar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Link
              to={linkTo}
              params={linkParams}
              className="btn-fire flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest"
            >
              <Play className="h-3.5 w-3.5" /> {item.type === 'course' ? 'Continuar Aluno' : 'Acessar E-book'}
            </Link>
          </div>
        )}
      </div>
    </article>
    </>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${accent ? "gradient-border" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire/20 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

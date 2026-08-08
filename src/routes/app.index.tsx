import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, ShoppingCart, Sparkles, Lock } from "lucide-react";
import { IMG, student } from "@/lib/platform-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { CourseCardSkeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "Início — Espetinho na Veia" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { isEnrolledInCourse, isLoading: isLoadingEnrollments } = useEnrollments();

  const { data: showcaseItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ["showcase-items"],
    queryFn: async () => {
      const [coursesRes, ebooksRes] = await Promise.all([
        supabase.from("courses").select("*").eq("is_locked", false),
        supabase.from("ebooks").select("*").eq("is_published", true),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (ebooksRes.error) throw ebooksRes.error;

      const items = [
        ...(coursesRes.data || []).map(c => ({ ...c, type: 'course' as const })),
        ...(ebooksRes.data || []).map(e => ({ ...e, type: 'ebook' as const })),
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

  // Fallback para o último curso se o usuário não tiver nada
  const lastId = student.lastLesson.courseId;
  const lastItem = showcaseItems?.find(i => i.id === lastId) || showcaseItems?.[0];



  return (
    <div className="space-y-8">
      {/* Showcase / Cursos */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight">Novidades para você</h2>
          <Link to="/app/cursos" className="text-sm font-medium text-gold hover:underline">Ver todos</Link>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showcaseItems?.map((item) => (
            <CourseShowcaseCard 
              key={`${item.type}-${item.id}`} 
              item={item} 
              isEnrolled={
                item.type === 'course' 
                  ? isEnrolledInCourse(item.id) || (item.price || 0) === 0
                  : isEnrolledInEbook(item.id) || (item.price || 0) === 0
              } 
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CourseShowcaseCard({ item, isEnrolled }: { item: any; isEnrolled: boolean }) {
  const isLocked = !isEnrolled;
  const linkTo = item.type === 'course' ? "/app/cursos/$courseId" : "/app/ebooks/$ebookId";
  const linkParams = item.type === 'course' ? { courseId: item.id } : { ebookId: item.id };
  
  return (
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

      <div className="p-5">
        <h3 className="font-display text-lg font-bold line-clamp-1">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground min-h-[40px]">{item.description}</p>
        
        {isLocked ? (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Acesso imediato</span>
                <div className="font-display text-xl font-bold text-gold">R$ {item.price?.toString().replace(".", ",")}</div>
              </div>
              <Link 
                to={linkTo} 
                params={linkParams}
                className="btn-fire px-4 py-2 text-xs pointer-events-auto cursor-pointer"
              >
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Comprar
              </Link>
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

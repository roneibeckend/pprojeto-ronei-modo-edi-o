import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Sparkles, Lock, ShoppingCart, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { ProgressSummary } from "@/components/platform/ProgressSummary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/use-enrollments";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/cursos/")({
  head: () => ({ meta: [{ title: "Meus cursos — Espetinho na Veia" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const { user } = useAuth();
  const { courseEnrollments, isLoading: isLoadingEnrollments } = useEnrollments();

  const { data: dbCourses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (isLoadingCourses || isLoadingEnrollments) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  // Cursos que o usuário possui (comprados ou gratuitos por padrão no banco)
  // No entanto, o requisito diz: "restringir o acesso a cursos e ebooks apenas para aqueles que realizaram a compra correspondente."
  // E "Conteúdos classificados como "receitas", "planilhas" e "materiais" devem ser considerados gratuitos"
  // Para cursos, assumimos que se não estiver em courseEnrollments, não está "comprado".
  // Exceto se o preço for 0? O usuário não especificou isso, mas geralmente preço 0 = livre.
  // "Conteúdo gratuito (receitas, planilhas, materiais) deve permanecer acessível para todos os clientes."
  // Cursos e Ebooks são o conteúdo pago.
  
  const owned = dbCourses?.filter((c) => courseEnrollments.includes(c.id) || c.price === 0) || [];
  const others = dbCourses?.filter((c) => !courseEnrollments.includes(c.id) && (c.price || 0) > 0) || [];

  const totalProgress = owned.length > 0 ? 0 : 0; // Seria necessário buscar o progresso real do banco

  return (
    <div className="pb-10">
      <PageHeader
        title="Meus cursos"
        subtitle="Gerencie seus treinamentos e descubra novos conteúdos."
        action={
          <Link to="/app/cursos/preview" className="btn-ghost-fire text-sm">
            <Sparkles className="h-4 w-4" /> Ver previews interativas
          </Link>
        }
      />

      <ProgressSummary 
        totalProgress={totalProgress}
        startedCount={0}
        finishedCount={0}
        streak={0}
      />

      {/* Seção de Cursos Adquiridos */}
      <section className="mb-12">
        <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Seus Treinamentos
        </h2>
        
        {owned.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {owned.map((c) => (
              <article key={c.id} className="glass card-tilt group overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-fire/30">
                <div className="relative aspect-video">
                  <img src={c.cover_url || ""} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  
                  {c.badge && (
                    <div className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                      <Sparkles className="mr-1 inline h-3 w-3" /> {c.badge}
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-tight">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  
                  <Link
                    to="/app/cursos/$courseId"
                    params={{ courseId: c.id }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-fire text-white shadow-lg shadow-fire/20 hover:brightness-110 transition-all"
                  >
                    <Play className="h-4 w-4 fill-current" /> 
                    Acessar curso
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center text-muted-foreground">
            Você ainda não possui nenhum curso liberado.
          </div>
        )}
      </section>

      {/* Seção de Cursos Disponíveis para Compra */}
      {others.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Disponíveis para Compra
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {others.map((c) => (
              <article key={c.id} className="glass overflow-hidden rounded-2xl border border-white/5 opacity-80 transition-opacity hover:opacity-100">
                <div className="relative aspect-video grayscale-[0.3]">
                  <img src={c.cover_url || ""} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-3 text-gold backdrop-blur-md">
                      <Lock className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-tight">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investimento</span>
                      <div className="font-display text-2xl font-bold text-gold">
                        R$ {c.price?.toString().replace(".", ",")}
                      </div>
                    </div>
                  </div>
                  <button className="btn-fire mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg shadow-fire/10">
                    <ShoppingCart className="h-4 w-4" /> Comprar e Liberar
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

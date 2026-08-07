import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { 
  Users, 
  LayoutDashboard, 
  Link as LinkIcon, 
  Wallet, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/afiliados")({
  component: AffiliateLayout,
});

function AffiliateLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: affiliateProfile } = useQuery({
    queryKey: ["affiliate-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", user?.id as string)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (affiliateProfile) {
      setIsAffiliate(true);
      setIsLoading(false);
    } else if (user?.id) {
      // Se carregou o perfil e não existe, não é afiliado ainda
      setIsAffiliate(false);
      setIsLoading(false);
    }
  }, [affiliateProfile, user?.id]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  // Se não for afiliado, mostrar convite para cadastro
  if (!isAffiliate) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="glass p-8 rounded-2xl border border-white/5 text-center">
          <div className="mb-6 rounded-full bg-fire/10 w-20 h-20 flex items-center justify-center mx-auto">
            <TrendingUp className="w-10 h-10 text-fire" />
          </div>
          <h1 className="text-3xl font-display font-black mb-4">Torne-se um Afiliado</h1>
          <p className="text-muted-foreground mb-8">
            Divulgue nossos cursos e receba comissões por cada venda realizada através do seu link exclusivo.
          </p>
          
          <div className="grid gap-4 text-left mb-8">
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="bg-fire/20 p-2 rounded-lg h-fit"><TrendingUp className="w-5 h-5 text-fire" /></div>
              <div>
                <h3 className="font-bold">Comissões de 30%</h3>
                <p className="text-xs text-muted-foreground">Ganhe uma fatia generosa de cada venda que você trouxer.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="bg-fire/20 p-2 rounded-lg h-fit"><LinkIcon className="w-5 h-5 text-fire" /></div>
              <div>
                <h3 className="font-bold">Links Personalizados</h3>
                <p className="text-xs text-muted-foreground">Gere links únicos para cada curso da nossa vitrine.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={async () => {
              if (!user) return;
              const { error } = await supabase.from('affiliates').insert({
                id: user.id,
                status: 'pending'
              });
              if (error) {
                toast.error("Erro ao solicitar cadastro: " + error.message);
              } else {
                toast.success("Solicitação enviada! Aguarde a aprovação administrativa.");
                window.location.reload();
              }
            }}
            className="btn-fire w-full py-4 text-lg font-bold"
          >
            Quero ser Afiliado
          </button>
        </div>
      </div>
    );
  }

  if (affiliateProfile?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-2">Solicitação em Análise</h2>
        <p className="text-muted-foreground">
          Sua solicitação para se tornar afiliado está sendo revisada por nossa equipe administrativa. 
          Você receberá uma notificação assim que for aprovado.
        </p>
        <Link to="/app" className="btn-ghost-fire mt-8">Voltar ao Início</Link>
      </div>
    );
  }

  if (affiliateProfile?.status === 'blocked') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-2">Conta Bloqueada</h2>
        <p className="text-muted-foreground">
          Seu acesso ao programa de afiliados foi suspenso. Entre em contato com o suporte para mais informações.
        </p>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", to: "/app/afiliados", icon: LayoutDashboard },
    { label: "Meus Links", to: "/app/afiliados/links", icon: LinkIcon },
    { label: "Financeiro", to: "/app/afiliados/financeiro", icon: Wallet },
    { label: "Configurações", to: "/app/afiliados/config", icon: Settings },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white">Painel do Afiliado</h1>
          <p className="text-muted-foreground">Gerencie suas vendas e comissões.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saldo Disponível</div>
            <div className="text-xl font-display font-black text-fire">
              R$ {affiliateProfile?.balance?.toFixed(2).replace(".", ",")}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Ganho</div>
            <div className="text-xl font-display font-black text-white">
              R$ {affiliateProfile?.total_earnings?.toFixed(2).replace(".", ",")}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "bg-fire text-white" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-white/5" }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

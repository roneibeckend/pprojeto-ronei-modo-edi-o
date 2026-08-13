import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/platform/Shell";
import { User, Mail, Phone, Calendar, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Espetinho na Veia" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfileData() {
      if (!user) return;
      
      try {
        // Load profile data
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        // Load user specific orders
        const { data: ordersData } = await supabase
          .from("course_enrollments")
          .select(`
            id,
            enrolled_at,
            course:courses(title),
            price_paid
          `)
          .eq("user_id", user.id)
          .order("enrolled_at", { ascending: false });

        if (ordersData) {
          setUserOrders(ordersData.map(o => ({
            id: `#ORD-${o.id.slice(0, 4).toUpperCase()}`,
            date: format(new Date(o.enrolled_at), "dd/MM/yyyy"),
            product: (o.course as any)?.title || "Conteúdo",
            status: "Pago",
            value: o.price_paid ? `R$ ${o.price_paid.toFixed(2).replace('.', ',')}` : "Grátis"
          })));
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader title="Meu perfil" subtitle="Gerencie seus dados e veja seu histórico de compras." />
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-2xl" />
            <Skeleton className="h-[200px] w-full rounded-2xl" />
          </aside>
          <div className="space-y-8">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="Meu perfil" subtitle="Gerencie seus dados e veja seu histórico de compras." />

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Sidebar Info */}
        <aside className="space-y-6">
          <section className="glass overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] shadow-sm">
            <div className="h-24 bg-gradient-to-br from-[#ff6a00] to-[#ff9500] opacity-20" />
            <div className="relative -mt-12 flex flex-col items-center p-6 text-center">
              <div className="relative group">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || user?.email}&backgroundColor=e11d48`} 
                  alt={profile?.full_name} 
                  className="h-24 w-24 rounded-2xl border-4 border-[#0a0a0a] object-cover ring-1 ring-white/10"
                />
                <button className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-lg bg-[#ff6a00] text-black shadow-lg transition-transform hover:scale-110">
                  <User className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{profile?.full_name || "Estudante"}</h3>
              <p className="text-sm text-white/40">Membro desde {profile?.created_at ? format(new Date(profile.created_at), "dd/MM/yyyy") : "—"}</p>
              
              <div className="mt-6 grid w-full grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <div className="text-lg font-bold text-[#ff6a00]">0</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Dias</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <div className="text-lg font-bold text-[#ff6a00]">0</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Aulas</div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Informações de contato</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-[#ff6a00]">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">E-mail</div>
                  <div className="text-sm font-medium break-words">{user?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-[#ff6a00]">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Telefone</div>
                  <div className="text-sm font-medium break-words">{profile?.phone || "Não informado"}</div>
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Personal Data Form */}
          <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Dados da Conta</h3>
                <p className="text-sm text-white/40">Mantenha suas informações sempre atualizadas.</p>
              </div>
              <button className="btn-fire w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-bold uppercase tracking-widest">Salvar</button>
            </div>
            
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <Field label="Nome completo" defaultValue={profile?.full_name || ""} icon={User} />
              <Field label="Seu e-mail" defaultValue={user?.email || ""} type="email" icon={Mail} />
              <Field label="WhatsApp / Telefone" defaultValue={profile?.phone || ""} icon={Phone} />
              <Field label="Data de cadastro" defaultValue={profile?.created_at ? format(new Date(profile.created_at), "dd/MM/yyyy") : "—"} disabled icon={Calendar} />
            </div>
          </section>

          {/* Order History */}
          <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6a00]/10 text-[#ff6a00]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">Histórico de Pedidos</h3>
                <p className="text-sm text-white/40">Acompanhe todos os seus investimentos na plataforma.</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px] md:min-w-0">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <th className="px-6 py-4">ID do Pedido</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Produto</th>
                      <th className="hidden md:table-cell px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-6 py-4 font-mono font-medium text-[#ff6a00]">{order.id}</td>
                        <td className="px-6 py-4 text-white/60">{order.date}</td>
                        <td className="px-6 py-4 font-medium">{order.product}</td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-white">{order.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {userOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-white/5">
                    <ShoppingBag className="h-6 w-6 text-white/20" />
                  </div>
                  <p className="text-sm text-white/40">Nenhum pedido encontrado no seu histórico.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ 
  label, 
  icon: Icon,
  ...rest 
}: { 
  label: string;
  icon?: any;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block group">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 transition-colors group-focus-within:text-[#ff6a00]">
        {label}
      </span>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-[#ff6a00]">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input 
          {...rest} 
          className={`w-full rounded-xl border border-white/10 bg-white/[0.03] ${Icon ? 'pl-11' : 'px-4'} py-3.5 text-sm font-medium outline-none transition-all placeholder:text-white/10 focus:border-[#ff6a00]/50 focus:bg-[#ff6a00]/5 disabled:opacity-50 text-[16px] md:text-sm`} 
        />
      </div>
    </label>
  );
}

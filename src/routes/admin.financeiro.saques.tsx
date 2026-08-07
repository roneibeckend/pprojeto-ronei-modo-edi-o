import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Loader2,
  DollarSign,
  Wallet,
  User,
  History,
  TrendingUp,
  CreditCard,
  Banknote
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePayoutStatus } from "@/lib/payouts.functions";

export const Route = createFileRoute("/admin/financeiro/saques")({
  head: () => ({ meta: [{ title: "Gestão de Saques de Sócios — Painel Admin" }] }),
  component: AdminPartnerPayoutsPage,
});

function AdminPartnerPayoutsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const updatePayoutFn = useServerFn(adminUpdatePayoutStatus);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-partner-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data?.filter(p => (p.metadata as any)?.user_type === 'partner') || [];
    }
  });

  const { data: partnerStats } = useQuery({
    queryKey: ["admin-partner-balances"],
    queryFn: async () => {
      // Como partner_balances não tem FK no schema cache, buscamos separado e cruzamos manualmente
      const [balancesRes, profilesRes] = await Promise.all([
        supabase.from("partner_balances").select("*"),
        supabase.from("profiles").select("id, name, email")
      ]);

      if (balancesRes.error) throw balancesRes.error;
      if (profilesRes.error) throw profilesRes.error;

      return balancesRes.data.map(balance => ({
        ...balance,
        profile: profilesRes.data.find(p => p.id === balance.user_id)
      }));
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'analyzing' | 'approved' | 'paid' | 'rejected' }) => {
      return updatePayoutFn({
        data: { payoutId: id, status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-payout-requests"] });
      toast.success("Status do saque atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  });

  const filtered = payouts?.filter(p => {
    const matchesSearch = 
      p.profile?.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.profile?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusMap = {
    pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
    analyzing: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500", icon: Loader2 },
    approved: { label: "Aprovado", color: "bg-indigo-500/10 text-indigo-500", icon: CheckCircle2 },
    paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-500", icon: XCircle },
  };

  const totalPending = payouts?.filter(p => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
  const totalPaid = payouts?.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <PageHeader 
        title="Gestão de Saques: Sócios" 
        subtitle="Controle detalhado de retiradas de lucro e saldos de sócios e parceiros." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Clock className="w-12 h-12 text-yellow-500" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Pendente (Sócios)</div>
          <div className="text-2xl font-display font-black text-white">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Pago (Sócios)</div>
          <div className="text-2xl font-display font-black text-white">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <User className="w-12 h-12 text-fire" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Sócios Ativos</div>
          <div className="text-2xl font-display font-black text-white">{partnerStats?.length || 0}</div>
        </div>

        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Wallet className="w-12 h-12 text-blue-500" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Saldo em Espera</div>
          <div className="text-2xl font-display font-black text-white">R$ {(partnerStats?.reduce((acc, s) => acc + (s.balance || 0), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
          <input 
            placeholder="Buscar sócio por nome ou e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-fire/50" 
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto whitespace-nowrap">
          {["all", "pending", "analyzing", "approved", "paid"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                statusFilter === s ? "bg-fire text-white shadow-lg shadow-fire/20" : "text-white/40 hover:text-white"
              }`}
            >
              {s === "all" ? "Todos" : statusMap[s as keyof typeof statusMap]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
            <History className="w-4 h-4" /> Solicitações de Retirada
          </div>
          
          {isLoading ? (
            <div className="flex h-64 items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
              <Loader2 className="h-8 w-8 animate-spin text-fire" />
            </div>
          ) : (
            <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#111]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <th className="px-6 py-4">Sócio</th>
                      <th className="px-6 py-4">Retirada</th>
                      <th className="px-6 py-4">Pagamento</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered && filtered.length > 0 ? (
                      filtered.map((p) => {
                        const status = statusMap[p.status as keyof typeof statusMap] || statusMap.pending;
                        return (
                          <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-white">{p.profile?.name || "Sócio"}</div>
                              <div className="text-[10px] text-white/30 truncate max-w-[150px]">{p.profile?.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white font-black text-base">R$ {p.amount?.toFixed(2).replace(".", ",")}</div>
                              <div className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-widest ${status.color}`}>
                                <status.icon className="w-2.5 h-2.5" />
                                {status.label}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase font-bold">
                                     <CreditCard className="w-3 h-3" /> PIX
                                  </div>
                                  <div className="font-mono text-[10px] bg-white/5 p-1.5 rounded border border-white/5 truncate max-w-[150px]">
                                    {p.pix_key}
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {p.status === 'pending' && (
                                  <button 
                                    onClick={() => updateMutation.mutate({ id: p.id, status: 'analyzing' })}
                                    className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition"
                                    title="Analisar"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                )}
                                {(p.status === 'pending' || p.status === 'analyzing') && (
                                  <>
                                    <button 
                                      onClick={() => updateMutation.mutate({ id: p.id, status: 'approved' })}
                                      className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition"
                                      title="Aprovar"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => updateMutation.mutate({ id: p.id, status: 'rejected' })}
                                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition"
                                      title="Rejeitar"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {p.status === 'approved' && (
                                  <button 
                                    onClick={() => updateMutation.mutate({ id: p.id, status: 'paid' })}
                                    className="px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition flex items-center gap-2"
                                  >
                                    <Banknote className="w-4 h-4" /> Pagar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic text-xs">
                          Nenhuma solicitação de saque de sócios.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
            <TrendingUp className="w-4 h-4" /> Saldos Disponíveis
          </div>
          
          <div className="border border-white/5 rounded-2xl bg-[#111] p-6 space-y-6">
            {partnerStats && partnerStats.length > 0 ? (
              partnerStats.map((stat) => (
                <div key={stat.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{stat.profile?.name || "Sócio"}</div>
                      <div className="text-[10px] text-white/30">{stat.profile?.email}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-emerald-400 font-black">R$ {stat.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                       <div className="text-[9px] text-white/20 uppercase tracking-widest">Disponível</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ 
                        width: `${Math.min(100, (stat.balance / (totalPaid + totalPending + 1)) * 100)}%` 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/30 uppercase tracking-widest">
                    <span>Total Retirado: R$ {stat.total_withdrawn?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Última at. {new Date(stat.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="border-b border-white/5 pt-3" />
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground italic text-xs py-8">
                Nenhum saldo de sócio encontrado.
              </div>
            )}
            
            <div className="bg-fire/5 border border-fire/10 p-4 rounded-xl">
               <h5 className="text-[10px] font-black uppercase text-fire mb-1 flex items-center gap-2">
                 <DollarSign className="w-3 h-3" /> Lucro a Distribuir
               </h5>
               <p className="text-[10px] text-white/40 leading-relaxed mb-3">
                 Saldos são atualizados via "Distribuir Lucros" no Painel Financeiro Principal.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

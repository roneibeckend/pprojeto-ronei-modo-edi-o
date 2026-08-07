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
  Filter,
  ArrowUpRight,
  ExternalLink,
  Wallet
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePayoutStatus } from "@/lib/payouts.functions";

export const Route = createFileRoute("/admin/financeiro/saques")({
  component: AdminPayoutsPage,
});

function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const updatePayoutFn = useServerFn(adminUpdatePayoutStatus);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'analyzing' | 'approved' | 'paid' | 'rejected' }) => {
      return updatePayoutFn({ payoutId: id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <PageHeader 
        title="Gestão de Saques" 
        subtitle="Analise e processe as solicitações de saque de afiliados e sócios." 
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
          <input 
            placeholder="Buscar por nome ou e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-fire/50" 
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
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

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-fire" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#111]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-white/40">
                <th className="px-6 py-4">Beneficiário</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Dados de Pagamento</th>
                <th className="px-6 py-4">Status</th>
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
                        <div className="font-bold text-white">{p.profile?.name || "Sem Nome"}</div>
                        <div className="text-xs text-white/40">{p.profile?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold text-lg">R$ {p.amount?.toFixed(2).replace(".", ",")}</div>
                        <div className="text-[10px] text-white/20 uppercase tracking-widest">Via {p.method}</div>
                      </td>
                      <td className="px-6 py-4">
                        {p.pix_key ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Chave PIX</div>
                            <div className="font-mono text-xs bg-white/5 p-2 rounded border border-white/5 inline-block">{p.pix_key}</div>
                          </div>
                        ) : (
                          <span className="text-white/20 italic">Não informado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'pending' && (
                            <button 
                              onClick={() => updateMutation.mutate({ id: p.id, status: 'analyzing' })}
                              className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition"
                            >
                              Analisar
                            </button>
                          )}
                          {(p.status === 'pending' || p.status === 'analyzing') && (
                            <>
                              <button 
                                onClick={() => updateMutation.mutate({ id: p.id, status: 'approved' })}
                                className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition"
                              >
                                Aprovar
                              </button>
                              <button 
                                onClick={() => updateMutation.mutate({ id: p.id, status: 'rejected' })}
                                className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button 
                              onClick={() => updateMutation.mutate({ id: p.id, status: 'paid' })}
                              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition flex items-center gap-2"
                            >
                              <Wallet className="w-3 h-3" /> Marcar como Pago
                            </button>
                          )}
                          {p.asaas_payment_id && (
                            <div className="text-[10px] text-white/20 font-mono">ID: {p.asaas_payment_id}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nenhuma solicitação de saque encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { requestPayout } from "@/lib/payouts.functions";

export const Route = createFileRoute("/app/afiliados/financeiro")({
  component: AffiliateFinancePage,
});

function AffiliateFinancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [pixKey, setPixKey] = useState("");

  const requestPayoutFn = useServerFn(requestPayout);

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["affiliate-sales-history", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_sales")
        .select(`
          *,
          course:courses(title)
        `)
        .eq("affiliate_id", user?.id as string)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["payout-requests", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user?.id as string)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: affiliateProfile } = useQuery({
    queryKey: ["affiliate-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", user?.id as string)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount < 50) {
        throw new Error("O valor mínimo para saque é R$ 50,00");
      }
      if (!pixKey) {
        throw new Error("Informe uma chave PIX para o recebimento");
      }
      return requestPayoutFn({
        data: {
          amount,
          method: "pix",
          pix_key: pixKey
        }
      });
    },
    onSuccess: () => {
      toast.success("Solicitação de saque enviada com sucesso!");
      setShowPayoutModal(false);
      setPayoutAmount("");
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-profile"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao solicitar saque");
    }
  });

  if (salesLoading || payoutsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  const statusMap = {
    pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
    analyzing: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500", icon: Loader2 },
    approved: { label: "Aprovado", color: "bg-indigo-500/10 text-indigo-500", icon: CheckCircle2 },
    paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-500", icon: XCircle },
  };

  return (
    <div className="space-y-8 text-left">
      <div className="grid md:grid-cols-2 gap-6">
        <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-fire" /> Extrato de Vendas
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#111] text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Comissão</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sales && sales.length > 0 ? (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-white/60">
                        {sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : '-'}
                        <div className="text-[10px] text-white/20 mt-1">{sale.course?.title || "Venda"}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-fire">
                        R$ {sale.commission?.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          sale.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          sale.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {sale.status === 'paid' ? 'Pago' : sale.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic text-xs">
                      Nenhuma venda registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-indigo-400" /> Histórico de Saques
            </h3>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#111] text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts && payouts.length > 0 ? (
                  payouts.map((p) => {
                    const status = statusMap[p.status as keyof typeof statusMap] || statusMap.pending;
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 text-white/60">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          R$ {p.amount?.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
                            <status.icon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic text-xs">
                      Nenhuma solicitação de saque.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="glass p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
         <div className="mb-6 rounded-full bg-fire/10 w-16 h-16 flex items-center justify-center mx-auto">
            <DollarSign className="w-8 h-8 text-fire" />
         </div>
         <h4 className="font-bold mb-2">Solicitar Saque</h4>
         <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
           Resgate suas comissões acumuladas diretamente para sua conta via PIX.
           O valor mínimo para resgate é de R$ 50,00.
         </p>
         <button 
           onClick={() => setShowPayoutModal(true)}
           disabled={!affiliateProfile || affiliateProfile.balance < 50}
           className="btn-fire px-10 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {affiliateProfile && affiliateProfile.balance < 50 
             ? `Saldo insuficiente (Mín. R$ 50)` 
             : "Solicitar Resgate agora"}
         </button>
      </div>

      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-display font-black mb-2">Novo Saque</h3>
            <p className="text-muted-foreground text-sm mb-6">Informe os dados para transferência via PIX.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Valor (Mín. R$ 50,00)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-fire/50"
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px]">
                  <span className="text-white/20">Saldo disponível:</span>
                  <span className="text-fire font-bold">R$ {affiliateProfile?.balance?.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Chave PIX</label>
                <input 
                  type="text" 
                  placeholder="E-mail, CPF, CNPJ ou Aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-fire/50"
                />
              </div>

              <button 
                onClick={() => payoutMutation.mutate()}
                disabled={payoutMutation.isPending}
                className="btn-fire w-full py-4 font-bold flex items-center justify-center gap-2 mt-4"
              >
                {payoutMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Confirmar Solicitação</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
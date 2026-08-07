import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { requestPayout } from "@/lib/payouts.functions";

export const Route = createFileRoute("/app/financeiro")({
  component: PartnerFinancePage,
});

function PartnerFinancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [pixKey, setPixKey] = useState("");

  const requestPayoutFn = useServerFn(requestPayout);

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["partner-balance", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_balances")
        .select("*")
        .eq("user_id", user?.id as string)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["partner-payout-requests", user?.id],
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
          pix_key: pixKey,
          user_type: 'partner'
        }
      });
    },
    onSuccess: () => {
      toast.success("Solicitação de saque enviada com sucesso!");
      setShowPayoutModal(false);
      setPayoutAmount("");
      queryClient.invalidateQueries({ queryKey: ["partner-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["partner-balance"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao solicitar saque");
    }
  });

  if (balanceLoading || payoutsLoading) {
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
    <div className="space-y-8 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white">Meu Financeiro</h1>
          <p className="text-muted-foreground">Área restrita para sócios e parceiros.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saldo Disponível</div>
            <div className="text-xl font-display font-black text-emerald-400">
              R$ {balanceData?.balance?.toFixed(2).replace(".", ",") || "0,00"}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Sacado</div>
            <div className="text-xl font-display font-black text-white">
              R$ {balanceData?.total_withdrawn?.toFixed(2).replace(".", ",") || "0,00"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-indigo-400" /> Histórico de Retiradas
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
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

        <div className="space-y-6">
          <section className="glass p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
            <div className="mb-6 rounded-full bg-fire/10 w-16 h-16 flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-fire" />
            </div>
            <h4 className="font-bold mb-2 text-white">Solicitar Retirada</h4>
            <p className="text-sm text-muted-foreground mb-6">
              O valor mínimo para resgate é de R$ 50,00. O pagamento será processado via PIX.
            </p>
            <button 
              onClick={() => setShowPayoutModal(true)}
              disabled={!balanceData || balanceData.balance < 50}
              className="btn-fire w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!balanceData || balanceData.balance < 50 
                ? `Saldo insuficiente` 
                : "Solicitar Saque"}
            </button>
          </section>

          <div className="p-6 rounded-2xl border border-white/5 bg-fire/5 space-y-3">
            <div className="flex items-center gap-2 text-fire text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              Dica Societária
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Mantenha seus dados PIX atualizados no seu perfil para evitar atrasos nas transferências de lucro.
            </p>
          </div>
        </div>
      </div>

      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-display font-black mb-2 text-white">Confirmar Saque</h3>
            <p className="text-muted-foreground text-sm mb-6">Informe o valor e sua chave PIX.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Valor da Retirada</label>
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
                  <span className="text-white/20">Saldo atual:</span>
                  <span className="text-emerald-400 font-bold">R$ {balanceData?.balance?.toFixed(2).replace(".", ",")}</span>
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
                  <>Solicitar Agora</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
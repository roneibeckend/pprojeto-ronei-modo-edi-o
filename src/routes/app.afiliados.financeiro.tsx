import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react";

export const Route = createFileRoute("/app/afiliados/financeiro")({
  component: AffiliateFinancePage,
});

function AffiliateFinancePage() {
  const { user } = useAuth();

  const { data: sales, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-fire" /> Extrato de Comissões
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Valor Venda</th>
                <th className="px-6 py-4">Comissão</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales && sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-white/60">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{sale.course?.title || "Venda Direta / Home"}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest">Venda #{sale.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      R$ {sale.amount?.toFixed(2).replace(".", ",")}
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
                        {sale.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : 
                         sale.status === 'cancelled' ? <XCircle className="w-3 h-3" /> : 
                         <Clock className="w-3 h-3" />}
                        {sale.status === 'paid' ? 'Pago' : sale.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nenhuma movimentação financeira registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="glass p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
         <h4 className="font-bold mb-2">Solicitar Saque</h4>
         <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
           As comissões ficam disponíveis para saque após 7 dias da confirmação da venda. 
           O valor mínimo para resgate é de R$ 50,00.
         </p>
         <button disabled className="btn-fire px-10 py-3 font-bold opacity-50 cursor-not-allowed">
           Indisponível no momento
         </button>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";

export const Route = createFileRoute("/app/afiliados/")({
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["affiliate-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: sales } = await supabase
        .from("affiliate_sales")
        .select("*")
        .eq("affiliate_id", user?.id as string);
      
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("clicks")
        .eq("affiliate_id", user?.id as string);

      const totalClicks = links?.reduce((acc, curr) => acc + (curr.clicks || 0), 0) || 0;
      const totalSales = sales?.length || 0;
      const conversionRate = totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0;

      return {
        totalSales,
        totalClicks,
        conversionRate,
        sales: sales?.slice(0, 5) || [] // Últimas 5 vendas
      };
    }
  });

  const cards = [
    { label: "Vendas Realizadas", value: stats?.totalSales || 0, icon: ShoppingCart, color: "text-blue-500" },
    { label: "Cliques nos Links", value: stats?.totalClicks || 0, icon: Users, color: "text-purple-500" },
    { label: "Taxa de Conversão", value: `${stats?.conversionRate?.toFixed(1)}%`, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6 px-0">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="glass p-5 sm:p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-white/5 ${card.color}`}>
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/20" />
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{card.label}</div>
            <div className="text-2xl sm:text-3xl font-display font-black text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Vendas Recentes</h3>
            <button className="text-xs font-bold uppercase tracking-widest text-fire hover:underline">Ver tudo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Data</th>
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">Valor Venda</th>
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">Sua Comissão</th>
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.sales && stats.sales.length > 0 ? (
                  stats.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-white/60 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-bold text-white text-right whitespace-nowrap">
                        R$ {sale.amount?.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-bold text-fire text-right whitespace-nowrap">
                        R$ {sale.commission?.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
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
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Users,
  Calendar,
  Filter,
  Download,
  Loader2,
  CalendarDays
} from "lucide-react";
import { useState } from "react";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/afiliados/financeiro")({
  component: AffiliateFinancialPage,
});

function AffiliateFinancialPage() {
  const [filterDays, setFilterDays] = useState("30");

  const { data: sales, isLoading } = useQuery({
    queryKey: ["affiliate-sales-detailed", filterDays],
    queryFn: async () => {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(filterDays));
      
      const { data, error } = await supabase
        .from("affiliate_sales")
        .select("*")
        .gte("created_at", date.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const totalEarnings = sales?.reduce((acc, curr) => acc + (curr.commission || 0), 0) || 0;
  const totalVolume = sales?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold">Relatório Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">Detalhamento de comissões e performance.</p>
        </div>
        <div className="flex items-center justify-center gap-2">
           <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex items-center gap-1 overflow-x-auto">
              {["7", "15", "30", "90"].map(days => (
                <button
                  key={days}
                  onClick={() => setFilterDays(days)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition whitespace-nowrap ${
                    filterDays === days ? "bg-fire text-white shadow-lg shadow-fire/20" : "text-white/40 hover:text-white"
                  }`}
                >
                  {days}D
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass p-5 sm:p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Comissões no Período</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-emerald-500">R$ {totalEarnings.toFixed(2).replace(".", ",")}</div>
        </div>
        <div className="glass p-5 sm:p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Volume de Vendas</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-white">R$ {totalVolume.toFixed(2).replace(".", ",")}</div>
        </div>
        <div className="glass p-5 sm:p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total de Vendas</div>
          <div className="text-2xl sm:text-3xl font-display font-black text-fire">{sales?.length || 0}</div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-fire" /> Detalhamento de Transações
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Data</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">ID Transação</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">Valor Total</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">Sua Comissão</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales && sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-white/60 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-mono text-[9px] sm:text-[10px] text-white/40 whitespace-nowrap">
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-white text-right whitespace-nowrap">
                      R$ {sale.amount?.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-emerald-500 text-right whitespace-nowrap">
                      + R$ {sale.commission?.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
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
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nenhuma venda encontrada para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
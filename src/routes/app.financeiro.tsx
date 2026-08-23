import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";
import { PayoutRequestPanel } from "@/components/platform/PayoutRequestPanel";

export const Route = createFileRoute("/app/financeiro")({
  head: () => ({
    meta: [
      { title: "Meu Financeiro — Área de Sócios" },
      {
        name: "description",
        content:
          "Acompanhe seu saldo de sócio, solicite saques via PIX e veja o histórico completo de retiradas.",
      },
      { property: "og:title", content: "Meu Financeiro — Área de Sócios" },
      {
        property: "og:description",
        content: "Saldo, saques via PIX e histórico de retiradas para sócios e parceiros.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnerFinancePage,
});

function PartnerFinancePage() {
  const { user } = useAuth();

  const { data: balanceData, isLoading } = useQuery({
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
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  const balance = Number(balanceData?.balance || 0);
  const withdrawn = Number(balanceData?.total_withdrawn || 0);

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white">Meu Financeiro</h1>
          <p className="text-muted-foreground">Área restrita para sócios e parceiros.</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Saldo Disponível
            </div>
            <div className="text-xl font-display font-black text-emerald-400">
              R$ {balance.toFixed(2).replace(".", ",")}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Sacado
            </div>
            <div className="text-xl font-display font-black text-white">
              R$ {withdrawn.toFixed(2).replace(".", ",")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <PayoutRequestPanel
            balance={balance}
            userType="partner"
            invalidateKeys={["partner-balance", "partner-payout-requests"]}
          />
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-fire/5 space-y-3">
          <div className="flex items-center gap-2 text-fire text-sm font-bold">
            <TrendingUp className="w-4 h-4" />
            Dica Societária
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Mantenha seus dados PIX atualizados e envie um documento legível no primeiro saque — isso
            acelera a análise das próximas retiradas.
          </p>
        </div>
      </div>
    </div>
  );
}

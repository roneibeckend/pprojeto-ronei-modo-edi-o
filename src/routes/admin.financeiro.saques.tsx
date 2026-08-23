import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Loader2,
  DollarSign,
  ArrowDownCircle,
  History,
  TrendingDown,
  RefreshCw,
  Plus,
  Calendar,
  FileText,
  AlertCircle,
  Wallet,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { syncAsaasTransfers, createManualTransfer } from "@/lib/asaas-transfers.functions";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/financeiro/saques")({
  head: () => ({ meta: [{ title: "Gestão de Saídas e Saques — Painel Admin" }] }),
  component: AdminAsaasTransfersPage,
});

function AdminAsaasTransfersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDesc, setManualDesc] = useState("");

  const syncTransfersFn = useServerFn(syncAsaasTransfers);
  const createManualFn = useServerFn(createManualTransfer);

  const { data: transfers, isLoading, isRefetching } = useQuery({
    queryKey: ["admin-asaas-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_transfers")
        .select("*")
        .order("transfer_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: payouts, isLoading: isPayoutsLoading } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*, profile:profiles(name, email)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => await syncTransfersFn(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
      toast.success(`${res.count} transferências sincronizadas!`);
    },
    onError: (error: any) => toast.error("Erro ao sincronizar: " + error.message),
  });

  // Sincroniza automaticamente as saídas do Asaas ao abrir o extrato
  const autoSyncedRef = useRef(false);
  useEffect(() => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    syncTransfersFn()
      .then(() => queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] }))
      .catch(() => {});
  }, [syncTransfersFn, queryClient]);



  const manualMutation = useMutation({
    mutationFn: async () => await createManualFn({
      data: {
        amount: parseFloat(manualAmount),
        transfer_date: new Date(manualDate).toISOString(),
        description: manualDesc,
        status: 'DONE'
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
      toast.success("Saque manual registrado!");
      setIsManualModalOpen(false);
      setManualAmount("");
      setManualDesc("");
    },
    onError: (error: any) => toast.error("Erro ao registrar: " + error.message),
  });

  // ---- Extrato: filtros de período / tipo / busca ----
  const [period, setPeriod] = useState<"today" | "7d" | "month" | "year" | "all" | "custom">("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "transfer" | "payout" | "manual">("all");

  const range = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    switch (period) {
      case "today": return { from: startOfDay(now), to: null as Date | null };
      case "7d": return { from: new Date(now.getTime() - 6 * 864e5), to: null };
      case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
      case "year": return { from: new Date(now.getFullYear(), 0, 1), to: null };
      case "custom": return {
        from: customFrom ? new Date(`${customFrom}T00:00:00`) : null,
        to: customTo ? new Date(`${customTo}T23:59:59`) : null,
      };
      default: return { from: null, to: null };
    }
  }, [period, customFrom, customTo]);

  const filteredTransfers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (transfers || []).filter((t) => {
      const d = new Date(t.transfer_date);
      if (range.from && d < range.from) return false;
      if (range.to && d > range.to) return false;
      if (typeFilter !== "all" && (t.transaction_type || "transfer") !== typeFilter) return false;
      if (term && !(t.description || "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [transfers, range, typeFilter, search]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, typeof filteredTransfers>();
    for (const t of filteredTransfers) {
      const key = new Date(t.transfer_date).toLocaleDateString("pt-BR");
      map.set(key, [...(map.get(key) || []), t]);
    }
    return Array.from(map.entries());
  }, [filteredTransfers]);

  const stats = useMemo(() => {
    const list = filteredTransfers;
    return {
      total: list.reduce((acc, t) => acc + Number(t.amount), 0),
      count: list.length,
      pending: list.filter((t) => t.status === "PENDING").length,
    };
  }, [filteredTransfers]);


  const typeMap: Record<string, string> = {
    payout: "Saque",
    transfer: "Asaas",
    manual: "Manual",
  };

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {

    PENDING: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
    DONE: { label: "Concluído", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    approved: { label: "Aprovado", color: "bg-blue-500/10 text-blue-500", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-500", icon: XCircle },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <PageHeader 
        title="Cockpit de Gestão de Saídas" 
        subtitle="Controle unificado de transferências automáticas e solicitações de saque." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Saídas no período", value: `R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-fire" },
          { label: "Pendentes (Asaas)", value: stats.pending, icon: Clock, color: "text-yellow-500" },
          { label: "Movimentações", value: stats.count, icon: Wallet, color: "text-blue-500" },
          { label: "Saques Afiliados", value: payouts?.length || 0, icon: LayoutDashboard, color: "text-emerald-500" },
        ].map((s, i) => (
          <div key={i} className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{s.label}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="transfers" className="w-full">
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="transfers">Extrato de Saídas</TabsTrigger>
          <TabsTrigger value="payouts">Solicitações de Saque</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="space-y-4 pt-4">
          {/* Barra de filtros do extrato */}
          <div className="border border-white/5 bg-white/[0.02] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {([
                ["today", "Hoje"],
                ["7d", "7 dias"],
                ["month", "Este mês"],
                ["year", "Este ano"],
                ["all", "Tudo"],
                ["custom", "Personalizado"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-full border transition ${
                    period === key ? "bg-fire text-white border-fire" : "border-white/10 text-white/60 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} variant="outline" className="border-white/10">
                  {syncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sincronizar Asaas
                </Button>
              </div>
            </div>

            {period === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-auto bg-white/5 border-white/10 text-white" />
                <span className="text-white/30 text-xs">até</span>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-auto bg-white/5 border-white/10 text-white" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {([
                ["all", "Todas origens"],
                ["transfer", "Asaas"],
                ["payout", "Saques"],
                ["manual", "Manual"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition ${
                    typeFilter === key ? "bg-white/10 text-white border-white/20" : "border-white/5 text-white/40 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="relative ml-auto min-w-[200px] flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  placeholder="Buscar descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Extrato estilo conta corrente, agrupado por dia */}
          <div className="border border-white/5 rounded-2xl bg-[#111] overflow-hidden">
            {isLoading ? (
              <div className="p-10 text-center text-white/40"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
            ) : groupedByDay.length === 0 ? (
              <div className="p-10 text-center text-white/40">Nenhuma saída registrada neste período.</div>
            ) : (
              groupedByDay.map(([day, items]) => {
                const dayTotal = items.reduce((acc, t) => acc + Number(t.amount), 0);
                return (
                  <div key={day}>
                    <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-y border-white/5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">{day}</span>
                      <span className="text-[11px] font-black text-fire">- R$ {dayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {items.map((t) => (
                        <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-white/60 shrink-0">
                            {typeMap[t.transaction_type || 'transfer'] || t.transaction_type}
                          </span>
                          <span className="text-sm text-white/80 flex-1 min-w-[140px] break-words">{t.description}</span>
                          <span className="text-[11px] text-white/40 shrink-0">{statusMap[t.status]?.label || t.status}</span>
                          <span className="text-sm font-black text-fire shrink-0 whitespace-nowrap">
                            - R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>


        
        <TabsContent value="payouts" className="space-y-4 pt-4">
          <AdminPayoutsPanel />
        </TabsContent>


        <TabsContent value="manual" className="space-y-6 pt-4">
          <div className="flex justify-end">
            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-fire text-white hover:bg-fire/90">
                  <Plus className="w-4 h-4 mr-2" /> Novo Registro Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Registrar Saída Manual</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01"
                      placeholder="0,00"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Descrição</Label>
                    <Textarea 
                      id="desc" 
                      placeholder="Motivo da saída..."
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsManualModalOpen(false)}>Cancelar</Button>
                  <Button 
                    className="bg-fire hover:bg-fire/90"
                    onClick={() => manualMutation.mutate()}
                    disabled={manualMutation.isPending || !manualAmount}
                  >
                    {manualMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar Registro"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border border-white/5 rounded-2xl overflow-x-auto bg-[#111]">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-[10px] uppercase font-bold text-white/40 bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transfers?.filter(t => t.transaction_type === 'manual').map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4">{new Date(t.transfer_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">{t.description}</td>
                    <td className="px-6 py-4 font-black text-indigo-400">R$ {Number(t.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createManualTransfer, syncAsaasTransfers } from "@/lib/asaas-transfers.functions";
import { AdminPayoutsPanel } from "@/components/admin/AdminPayoutsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Loader2, Plus, RefreshCw, Search, TrendingDown, Wallet } from "lucide-react";

type Period = "today" | "7d" | "month" | "prev-month" | "year" | "all" | "custom";

const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeMap: Record<string, string> = {
  payout: "Saque",
  transfer: "Asaas",
  manual: "Manual",
};

const statusMap: Record<string, string> = {
  PENDING: "Pendente",
  DONE: "Concluído",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
  paid: "Pago",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export function FinanceOutflowStatement() {
  const queryClient = useQueryClient();
  const syncTransfersFn = useServerFn(syncAsaasTransfers);
  const createManualFn = useServerFn(createManualTransfer);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "transfer" | "payout" | "manual">("all");

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualDesc, setManualDesc] = useState("");

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["admin-asaas-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_transfers")
        .select("*")
        .order("transfer_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => await syncTransfersFn(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
      toast.success(`${res?.count ?? 0} movimentações sincronizadas do Asaas.`);
    },
    onError: (error: any) => toast.error("Erro ao sincronizar: " + error.message),
  });

  // Sincroniza automaticamente as saídas da conta Asaas ao abrir o extrato
  const autoSyncedRef = useRef(false);
  useEffect(() => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    syncTransfersFn()
      .then(() => queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] }))
      .catch(() => {});
  }, [syncTransfersFn, queryClient]);

  const manualMutation = useMutation({
    mutationFn: async () =>
      await createManualFn({
        data: {
          amount: parseFloat(manualAmount),
          transfer_date: new Date(`${manualDate}T12:00:00`).toISOString(),
          description: manualDesc || "Saída manual",
          status: "DONE",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
      toast.success("Saída manual registrada no extrato.");
      setIsManualModalOpen(false);
      setManualAmount("");
      setManualDesc("");
    },
    onError: (error: any) => toast.error("Erro ao registrar: " + error.message),
  });

  const range = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: null as Date | null };
      case "7d":
        return { from: startOfDay(new Date(now.getTime() - 6 * 864e5)), to: null };
      case "month":
        return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
      case "prev-month":
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        };
      case "year":
        return { from: new Date(now.getFullYear(), 0, 1), to: null };
      case "custom":
        return {
          from: customFrom ? new Date(`${customFrom}T00:00:00`) : null,
          to: customTo ? new Date(`${customTo}T23:59:59`) : null,
        };
      default:
        return { from: null, to: null };
    }
  }, [period, customFrom, customTo]);

  const filtered = useMemo(() => {
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
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const key = new Date(t.transfer_date).toLocaleDateString("pt-BR");
      map.set(key, [...(map.get(key) || []), t]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: filtered.reduce((acc, t) => acc + Number(t.amount), 0),
      count: filtered.length,
      pending: filtered.filter((t) => t.status === "PENDING").length,
    }),
    [filtered],
  );

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Saídas no período", value: `R$ ${brl(stats.total)}`, icon: TrendingDown, color: "text-fire" },
          { label: "Movimentações", value: String(stats.count), icon: Wallet, color: "text-blue-400" },
          { label: "Pendentes (Asaas)", value: String(stats.pending), icon: Clock, color: "text-yellow-500" },
        ].map((s) => (
          <div key={s.label} className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">
              <s.icon className="h-3 w-3" /> {s.label}
            </div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="statement" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 border border-white/5 bg-white/5 sm:inline-flex sm:w-auto">
          <TabsTrigger value="statement" className="text-[11px] sm:text-sm">Extrato de Saídas</TabsTrigger>
          <TabsTrigger value="payouts" className="text-[11px] sm:text-sm">Solicitações de Saque</TabsTrigger>
        </TabsList>


        <TabsContent value="statement" className="space-y-4 pt-4">
          <div className="border border-white/5 bg-white/[0.02] rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["today", "Hoje"],
                  ["7d", "7 dias"],
                  ["month", "Este mês"],
                  ["prev-month", "Mês anterior"],
                  ["year", "Este ano"],
                  ["all", "Tudo"],
                  ["custom", "Personalizado"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-full border transition min-h-[36px] ${
                    period === key ? "bg-fire text-white border-fire" : "border-white/10 text-white/60 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  variant="outline"
                  className="w-full min-h-[44px] border-white/10 sm:w-auto"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Sincronizar Asaas</span>
                </Button>
                <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full min-h-[44px] bg-fire text-white hover:bg-fire/90 sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" /> Saída manual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto border-white/10 bg-[#111] text-white">

                    <DialogHeader>
                      <DialogTitle>Registrar Saída Manual</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="out-amount">Valor (R$)</Label>
                        <Input
                          id="out-amount"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="out-date">Data</Label>
                        <Input
                          id="out-date"
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="out-desc">Descrição</Label>
                        <Textarea
                          id="out-desc"
                          placeholder="Motivo da saída..."
                          value={manualDesc}
                          onChange={(e) => setManualDesc(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsManualModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        className="bg-fire hover:bg-fire/90"
                        onClick={() => manualMutation.mutate()}
                        disabled={manualMutation.isPending || !manualAmount}
                      >
                        {manualMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Registro"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {period === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-auto bg-white/5 border-white/10 text-white"
                />
                <span className="text-white/30 text-xs">até</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-auto bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["all", "Todas origens"],
                  ["transfer", "Asaas"],
                  ["payout", "Saques"],
                  ["manual", "Manual"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition ${
                    typeFilter === key
                      ? "bg-white/10 text-white border-white/20"
                      : "border-white/5 text-white/40 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="relative w-full min-w-0 flex-1 sm:ml-auto sm:max-w-xs">
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

          <div className="border border-white/5 rounded-xl bg-[#111] overflow-hidden">
            {isLoading ? (
              <div className="p-10 text-center text-white/40">
                <Loader2 className="w-5 h-5 animate-spin inline" />
              </div>
            ) : groupedByDay.length === 0 ? (
              <div className="p-10 text-center text-white/40 text-sm">
                Nenhuma saída registrada neste período.
              </div>
            ) : (
              groupedByDay.map(([day, items]) => {
                const dayTotal = items.reduce((acc, t) => acc + Number(t.amount), 0);
                return (
                  <div key={day}>
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white/[0.03] border-y border-white/5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">{day}</span>
                      <span className="text-[11px] font-black text-fire">− R$ {brl(dayTotal)}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {items.map((t) => (
                        <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-white/60 shrink-0">
                            {typeMap[t.transaction_type || "transfer"] || t.transaction_type}
                          </span>
                          <span className="text-sm text-white/80 flex-1 min-w-[140px] break-words">{t.description}</span>
                          <span className="text-[11px] text-white/40 shrink-0">
                            {statusMap[t.status] || t.status}
                          </span>
                          <span className="text-sm font-black text-fire shrink-0 whitespace-nowrap">
                            − R$ {brl(Number(t.amount))}
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

        <TabsContent value="payouts" className="pt-4">
          <AdminPayoutsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

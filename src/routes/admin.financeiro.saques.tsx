import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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

  const stats = useMemo(() => {
    if (!transfers) return { total: 0, count: 0, pending: 0 };
    return {
      total: transfers.reduce((acc, t) => acc + Number(t.amount), 0),
      count: transfers.length,
      pending: transfers.filter(t => t.status === 'PENDING').length
    };
  }, [transfers]);

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
          { label: "Total Sacado (Geral)", value: `R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: "text-fire" },
          { label: "Pendentes (Asaas)", value: stats.pending, icon: Clock, color: "text-yellow-500" },
          { label: "Qtd. Total", value: stats.count, icon: Wallet, color: "text-blue-500" },
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
          <TabsTrigger value="transfers">Transferências Asaas</TabsTrigger>
          <TabsTrigger value="payouts">Solicitações de Saque</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="space-y-4 pt-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} variant="outline" className="border-white/10">
              {syncMutation.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sincronizar
            </Button>
          </div>
          <div className="border border-white/5 rounded-2xl overflow-x-auto bg-[#111]">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-[10px] uppercase font-bold text-white/40 bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transfers?.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4">{new Date(t.transfer_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">{t.description}</td>
                    <td className="px-6 py-4 font-black text-fire">R$ {Number(t.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">{statusMap[t.status]?.label || t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="payouts" className="space-y-4 pt-4">
          <div className="border border-white/5 rounded-2xl overflow-x-auto bg-[#111]">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-[10px] uppercase font-bold text-white/40 bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts?.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">{(p.profile as any)?.name || "N/A"}</td>
                    <td className="px-6 py-4">{new Date(p.created_at || Date.now()).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-black text-emerald-400">R$ {Number(p.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">{statusMap[p.status]?.label || p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

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
  AlertCircle
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

export const Route = createFileRoute("/admin/financeiro/saques")({
  head: () => ({ meta: [{ title: "Gestão de Saques e Saídas — Painel Admin" }] }),
  component: AdminAsaasTransfersPage,
});

function AdminAsaasTransfersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  // Form state for manual transfer
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

  const syncMutation = useMutation({
    mutationFn: async () => {
      return syncTransfersFn();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
      toast.success(`${res.count} transferências sincronizadas com sucesso!`);
    },
    onError: (error: any) => {
      toast.error("Erro ao sincronizar: " + error.message);
    }
  });

  const manualMutation = useMutation({
    mutationFn: async () => {
      return createManualFn({
        data: {
          amount: parseFloat(manualAmount),
          transfer_date: new Date(manualDate).toISOString(),
          description: manualDesc,
          status: 'DONE'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
      toast.success("Saque manual registrado!");
      setIsManualModalOpen(false);
      setManualAmount("");
      setManualDesc("");
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar: " + error.message);
    }
  });

  const filteredTransfers = useMemo(() => {
    return transfers?.filter(t => 
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.asaas_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.amount.toString().includes(search)
    ) || [];
  }, [transfers, search]);

  const stats = useMemo(() => {
    if (!transfers) return { total: 0, count: 0, pending: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransfers = transfers.filter(t => {
      const date = new Date(t.transfer_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    return {
      total: monthlyTransfers.reduce((acc, t) => acc + Number(t.amount), 0),
      count: monthlyTransfers.length,
      pending: transfers.filter(t => t.status === 'PENDING').length
    };
  }, [transfers]);

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    PENDING: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
    BANK_PAID: { label: "Pago", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    DONE: { label: "Concluído", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    FAILED: { label: "Falhou", color: "bg-red-500/10 text-red-500", icon: XCircle },
    CANCELLED: { label: "Cancelado", color: "bg-white/10 text-white/40", icon: AlertCircle },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Dashboard de Saídas" 
          subtitle="Controle centralizado de fluxo de caixa: saques Asaas e registros manuais." 
        />
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || isRefetching}
          >
            {syncMutation.isPending || isRefetching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar Asaas
          </Button>

          <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-fire text-white hover:bg-fire/90 shadow-lg shadow-fire/20">
                <Plus className="w-4 h-4 mr-2" />
                Novo Registro Manual
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
                  <Label htmlFor="date">Data da Transferência</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição / Motivo</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Ex: Pagamento de impostos, Saque para conta corrente..."
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
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
                  {manualMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Registro"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <TrendingDown className="w-12 h-12 text-fire" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Sacado (Mês Atual)</div>
          <div className="text-2xl font-display font-black text-white">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Clock className="w-12 h-12 text-yellow-500" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Transferências Pendentes</div>
          <div className="text-2xl font-display font-black text-white">{stats.pending}</div>
        </div>

        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <DollarSign className="w-12 h-12 text-blue-500" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Qtd. Operações (Mês)</div>
          <div className="text-2xl font-display font-black text-white">{stats.count}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
        <input 
          placeholder="Filtrar por descrição, ID Asaas ou valor..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-fire/50" 
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
          <History className="w-4 h-4" /> Log de Saídas (Fluxo de Caixa)
        </div>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
            <Loader2 className="h-8 w-8 animate-spin text-fire" />
          </div>
        ) : (
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#111]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransfers.length > 0 ? (
                    filteredTransfers.map((t) => {
                      const status = statusMap[t.status] || { label: t.status, color: "text-white/40", icon: AlertCircle };
                      const isManual = t.transaction_type === 'manual';
                      
                      return (
                        <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-white/20" />
                              <div className="text-white font-medium">{new Date(t.transfer_date).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-[300px]">
                              <div className="text-white font-bold truncate">{t.description}</div>
                              {t.asaas_id && (
                                <div className="text-[10px] text-white/20 font-mono mt-0.5">ID: {t.asaas_id}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-fire font-black text-base flex items-center gap-1">
                              <ArrowDownCircle className="w-3 h-3" />
                              R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
                              <status.icon className="w-3 h-3" />
                              {status.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isManual ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              <FileText className="w-2.5 h-2.5" />
                              {isManual ? 'Manual' : 'Asaas API'}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic text-xs">
                        Nenhum registro de saída encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

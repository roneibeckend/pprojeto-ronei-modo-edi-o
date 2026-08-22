import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  Terminal, 
  Search, 
  Filter, 
  Trash2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Bug,
  RefreshCw,
  Clock,
  User,
  ExternalLink,
  ChevronDown,
  X,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Logs do Sistema · Admin" }] }),
  component: AdminLogsPage,
});

const ORANGE = "#ff6a00";

function AdminLogsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['admin-logs', levelFilter],
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (levelFilter !== "all") {
        // Aceita registros gravados em maiúsculas ou minúsculas
        query = query.ilike('level', levelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      await clearSystemLogs({});
    },
    onSuccess: () => {
      toast.success("Logs limpos com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao limpar logs: " + error.message);
    }
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.profiles?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20"><Bug className="w-3 h-3 mr-1" /> ERROR</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertTriangle className="w-3 h-3 mr-1" /> WARNING</Badge>;
      case 'INFO':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Info className="w-3 h-3 mr-1" /> INFO</Badge>;
      case 'DEBUG':
        return <Badge variant="outline" className="bg-white/5 text-white/40 border-white/10"><Terminal className="w-3 h-3 mr-1" /> DEBUG</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-4 w-4" style={{ color: ORANGE }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Monitoramento Proativo</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white">
            Logs do <span style={{ color: ORANGE }}>Sistema</span>
          </h1>
          <p className="mt-2 text-sm text-white/50 max-w-2xl text-left">
            Acompanhe erros, avisos e eventos críticos da plataforma em tempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-10 bg-white/5 border-white/10 text-white/60 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          {isAdmin && (
             <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                if (window.confirm("Deseja realmente limpar todos os logs?")) {
                  clearLogsMutation.mutate();
                }
              }}
              className="h-10 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input 
              placeholder="Buscar por mensagem, origem ou usuário..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 h-12 focus:border-[#ff6a00]/50 transition-all"
            />
          </div>
        </div>
        <div className="md:col-span-4">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 h-12">
              <div className="flex items-center gap-2 text-white/60">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por Nível" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              <SelectItem value="all">Todos os Níveis</SelectItem>
              <SelectItem value="ERROR">Erro (ERROR)</SelectItem>
              <SelectItem value="WARNING">Aviso (WARNING)</SelectItem>
              <SelectItem value="INFO">Informação (INFO)</SelectItem>
              <SelectItem value="DEBUG">Depuração (DEBUG)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#111] border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#ff6a00]" /> Histórico de Eventos
            </CardTitle>
            <Badge variant="outline" className="text-[9px] font-bold uppercase border-white/10 text-white/40">
              {filteredLogs.length} Entradas Encontradas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/20 bg-white/[0.02]">
                  <th className="px-6 py-4 w-[180px]">Data/Hora</th>
                  <th className="px-6 py-4 w-[120px]">Nível</th>
                  <th className="px-6 py-4 w-[120px]">Origem</th>
                  <th className="px-6 py-4">Mensagem</th>
                  <th className="px-6 py-4 w-[180px]">Usuário</th>
                  <th className="px-6 py-4 w-[80px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className={cn(
                        "group transition-colors hover:bg-white/[0.02] cursor-pointer",
                        log.level === 'ERROR' && "bg-red-500/[0.02]"
                      )}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-white/60 text-xs">
                          <Clock className="w-3 h-3 text-[#ff6a00]/50" />
                          {format(new Date(log.created_at), "dd MMM, HH:mm:ss", { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getLevelBadge(log.level)}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {log.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[400px]">
                        <p className="text-sm text-white/80 line-clamp-1 group-hover:line-clamp-none transition-all">
                          {log.message}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {log.profiles ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-white/60 flex items-center gap-1">
                              <User className="w-3 h-3" /> {log.profiles.name || "Sem Nome"}
                            </span>
                            <span className="text-[9px] text-white/20 truncate">{log.profiles.email}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/20 italic">Sistema / Anônimo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-white/20 group-hover:text-[#ff6a00] transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/20 italic text-sm">
                      Nenhum log encontrado para os critérios selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 max-w-2xl text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {selectedLog && getLevelBadge(selectedLog.level)}
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-2 py-1 rounded bg-white/5 border border-white/5">
                {selectedLog?.source}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white mb-2">
              Detalhes do Log
            </DialogTitle>
            <DialogDescription className="text-white/40">
              {selectedLog && format(new Date(selectedLog.created_at), "eeee, d 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="p-4 rounded-xl bg-black border border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6a00] mb-3">Mensagem</h4>
              <p className="text-sm leading-relaxed text-white/90 font-medium">
                {selectedLog?.message}
              </p>
            </div>

            {selectedLog?.details && Object.keys(selectedLog.details).length > 0 && (
              <div className="p-4 rounded-xl bg-black border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-3">Payload de Dados</h4>
                <pre className="text-[11px] font-mono p-4 bg-white/[0.02] rounded-lg overflow-x-auto text-blue-300/80 custom-scrollbar border border-white/5">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Usuário</h4>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{selectedLog?.profiles?.name || "Sistema"}</div>
                    <div className="text-[9px] text-white/20">{selectedLog?.profiles?.email || "internal@system"}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-2">Infraestrutura</h4>
                <div className="space-y-1">
                  <div className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Endereço IP</div>
                  <div className="text-xs font-mono">{selectedLog?.ip_address || "N/A"}</div>
                </div>
              </div>
            </div>

            {selectedLog?.user_agent && (
              <div className="p-4 rounded-xl bg-black border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">User Agent</h4>
                <p className="text-[10px] font-mono text-white/30 break-all leading-tight">
                  {selectedLog.user_agent}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setSelectedLog(null)}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Fechar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

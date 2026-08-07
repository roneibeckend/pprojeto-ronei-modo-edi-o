import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  Send, 
  Clock, 
  Globe, 
  Activity, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Smartphone,
  Download,
  Eye,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios Financeiros · Admin" }] }),
  component: AdminRelatoriosPage,
});

const ORANGE = "#ff6a00";

function AdminRelatoriosPage() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [recipientsRes, settingsRes, logsRes] = await Promise.all([
        supabase.from('report_recipients').select('*').order('created_at', { ascending: false }),
        supabase.from('report_settings').select('*').single(),
        supabase.from('report_logs').select('*, recipient:report_recipients(name)').order('created_at', { ascending: false }).limit(20)
      ]);

      if (recipientsRes.error) throw recipientsRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setRecipients(recipientsRes.data || []);
      setSettings(settingsRes.data);
      setLogs(logsRes.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecipientSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { error } = await supabase.from('report_recipients').upsert(editingRecipient);
      if (error) throw error;
      
      toast.success("Destinatário salvo!");
      setIsRecipientModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleRecipient(id: string, active: boolean) {
    try {
      const { error } = await supabase.from('report_recipients').update({ active }).eq('id', id);
      if (error) throw error;
      setRecipients((prev: any[]) => prev.map(r => r.id === id ? { ...r, active } : r));
      toast.success(active ? "Destinatário ativado" : "Destinatário desativado");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  }

  async function handleSettingsUpdate(patch: any) {
    try {
      const { error } = await supabase.from('report_settings').update(patch).eq('id', settings.id);
      if (error) throw error;
      setSettings((prev: any) => ({ ...prev, ...patch }));
      toast.success("Configurações atualizadas!");
    } catch (error: any) {
      toast.error("Erro ao atualizar configurações: " + error.message);
    }
  }

  async function handleTestSend(recipientId: string, isResend: boolean = false) {
    try {
      toast.loading(isResend ? "Reenviando relatório..." : "Enviando relatório de teste...");
      // Nota: Aqui chamaremos a Edge Function no futuro. 
      // Por enquanto, simulamos para a UI.
      
      const { data, error } = await supabase.functions.invoke('daily-financial-report', {
        body: { recipient_id: recipientId, test: true }
      });

      // Se der erro 404 na Edge Function (não implantada), tentamos o Server Route
      if (error || !data) {
        const response = await fetch('/api/public/daily-financial-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_id: recipientId, test: true })
        });
        
        if (!response.ok) throw new Error(await response.text());
      }
      
      toast.dismiss();
      toast.success(isResend ? "Relatório reenviado!" : "Teste enviado com sucesso!");
      fetchData(); // Atualiza logs
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erro ao enviar: " + (error.message || "Verifique as configurações"));
    }
  }

  async function handleExportCSV() {
    try {
      const { data, error } = await supabase
        .from('report_logs')
        .select('*, recipient:report_recipients(name, phone_e164)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = ["ID", "Destinatário", "Telefone", "Data do Relatório", "Status", "Enviado em", "Erro"];
      const rows = data.map(log => [
        log.id,
        log.recipient?.name || "Sistema",
        log.recipient?.phone_e164 || "",
        log.report_date,
        log.status,
        log.sent_at ? new Date(log.sent_at).toLocaleString('pt-BR') : "",
        log.error || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorios_financeiros_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exportado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao exportar CSV: " + error.message);
    }
  }

  async function handleOpenPreview() {
    try {
      setIsLoadingPreview(true);
      setIsPreviewOpen(true);
      
      const response = await fetch('/api/public/daily-financial-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview: true })
      });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setPreviewData(data.data);
    } catch (error: any) {
      toast.error("Erro ao carregar pré-visualização: " + error.message);
      setIsPreviewOpen(false);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Relatórios Automáticos</h2>
          <p className="text-sm text-white/40 text-left">Relatórios diários via WhatsApp.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={handleOpenPreview}
             className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/60 uppercase tracking-widest hover:text-white hover:bg-white/10 transition"
           >
             <Eye className="h-3 w-3" /> Pré-visualizar
           </button>
           <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/60 uppercase tracking-widest hover:text-white hover:bg-white/10 transition"
           >
             <Download className="h-3 w-3" /> Exportar CSV
           </button>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Status Geral:</span>
              <button 
                onClick={() => handleSettingsUpdate({ enabled: !settings.enabled })}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${settings.enabled ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-black transition-transform ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configurações Gerais */}
        <div className="space-y-6 lg:col-span-1">
          <section className="border border-white/5 bg-[#111] p-6 rounded-xl">
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              <Settings className="h-4 w-4" style={{ color: ORANGE }} /> Configurações de Envio
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <Clock className="h-3 w-3" /> Horário (Fuso Local)
                </label>
                <input 
                  type="time" 
                  value={settings.send_time} 
                  onChange={e => handleSettingsUpdate({ send_time: e.target.value })}
                  className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-[#ff6a00]" 
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <Globe className="h-3 w-3" /> Fuso Horário
                </label>
                <select 
                  value={settings.timezone}
                  onChange={e => handleSettingsUpdate({ timezone: e.target.value })}
                  className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-[#ff6a00]"
                >
                  <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
                  <option value="America/Manaus">Manaus (UTC-4)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white/80">Enviar sem atividade</div>
                    <div className="text-[10px] text-white/40">Enviar mesmo se não houver vendas.</div>
                  </div>
                  <button 
                    onClick={() => handleSettingsUpdate({ send_when_no_activity: !settings.send_when_no_activity })}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${settings.send_when_no_activity ? 'bg-[#ff6a00]' : 'bg-white/10'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-black transition-transform ${settings.send_when_no_activity ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="border border-white/5 bg-[#111] p-6 rounded-xl">
             <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                <Activity className="h-4 w-4" style={{ color: ORANGE }} /> Logs de Envio (Top 20)
              </div>
              {logs.some(l => l.status === 'failed') && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                  <AlertCircle className="h-2.5 w-2.5" /> Falhas detectadas
                </div>
              )}
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.map(log => (
                <div key={log.id} className="text-[10px] flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                  <div className="space-y-0.5">
                    <div className="text-white/80 font-bold">{log.recipient?.name || 'Sistema'}</div>
                    <div className="text-white/40">{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  {log.status === 'sent' ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="h-3 w-3" /> Enviado</div>
                  ) : log.status === 'skipped' ? (
                    <div className="flex items-center gap-1 text-white/40 font-bold"><AlertCircle className="h-3 w-3" /> Pulado</div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400 font-bold" title={log.error}><XCircle className="h-3 w-3" /> Falha</div>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-4 text-center text-[10px] text-white/20">Sem logs recentes.</div>
              )}
            </div>
          </section>
        </div>

        {/* Gestão de Destinatários */}
        <div className="lg:col-span-2 space-y-6">
          <section className="border border-white/5 bg-[#111] p-6 rounded-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                <Smartphone className="h-4 w-4" style={{ color: ORANGE }} /> Destinatários do WhatsApp
              </div>
              <button 
                onClick={() => { setEditingRecipient({ name: "", phone_e164: "55", active: true, report_types: ['financial'] }); setIsRecipientModalOpen(true); }}
                className="flex items-center gap-2 bg-[#ff6a00] px-3 py-1.5 rounded text-[10px] font-bold text-black uppercase tracking-widest"
              >
                <Plus className="h-3 w-3" /> Novo
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recipients.map(r => (
                <div key={r.id} className="p-4 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm">{r.name}</h3>
                      <p className="text-xs text-white/40 font-mono mt-0.5">{r.phone_e164}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleRecipient(r.id, !r.active)}
                      className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${r.active ? 'bg-[#ff6a00]' : 'bg-white/10'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-black transition-transform ${r.active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                    <button 
                      onClick={() => handleTestSend(r.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-white/5 hover:bg-white/10 transition text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
                    >
                      <Send className="h-3 w-3" /> Testar
                    </button>
                    <button 
                      onClick={() => { setEditingRecipient(r); setIsRecipientModalOpen(true); }}
                      className="p-1.5 rounded hover:bg-white/5 text-white/20 hover:text-white transition"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {recipients.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Nenhum destinatário cadastrado.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Recipient */}
      {isRecipientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold">{editingRecipient?.id ? "Editar Destinatário" : "Novo Destinatário"}</h3>
              <button onClick={() => setIsRecipientModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleRecipientSubmit} className="space-y-6 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nome Completo</label>
                <input 
                  required 
                  value={editingRecipient?.name || ""} 
                  onChange={e => setEditingRecipient({...editingRecipient, name: e.target.value})} 
                  placeholder="Ex: João Silva" 
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">WhatsApp (E.164)</label>
                <input 
                  required 
                  value={editingRecipient?.phone_e164 || ""} 
                  onChange={e => setEditingRecipient({...editingRecipient, phone_e164: e.target.value.replace(/[^0-9]/g, '')})} 
                  placeholder="5511999999999" 
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] font-mono" 
                />
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">DDI + DDD + Número (Apenas números)</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsRecipientModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 font-bold hover:bg-white/10 transition uppercase tracking-widest text-[10px]">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-[#ff6a00] text-black font-bold disabled:opacity-50 transition uppercase tracking-widest text-[10px]">
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
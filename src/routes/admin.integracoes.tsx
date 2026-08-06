import { createFileRoute } from '@tanstack/react-router';
import { 
  Sparkles, 
  CreditCard, 
  Settings2, 
  Activity, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Wallet,
  Plus,
  Save,
  Globe,
  Key
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { testAIConnection, saveIntegration } from "@/lib/integrations.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute('/admin/integracoes')({
  head: () => ({ meta: [{ title: "Hub de Integrações · Admin" }] }),
  component: IntegrationsPage,
});

const ORANGE = "#ff6a00";

type IntegrationStatus = 'connected' | 'error' | 'disconnected' | 'loading';

interface Integration {
  id: string;
  name: string;
  type: 'ia' | 'payment';
  category: string;
  status: boolean;
  credentials: any;
  settings: any;
  updated_at?: string;
}

function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ia' | 'payment'>('ia');
  const [editingItem, setEditingItem] = useState<Integration | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testConnectionFn = useServerFn(testAIConnection);
  const saveIntegrationFn = useServerFn(saveIntegration);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('integrations').select('*');
      if (error) throw error;
      return data as Integration[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
      const { error } = await supabase.from('integrations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success("Status atualizado");
    }
  });

  const handleTest = async () => {
    if (!editingItem) return;
    try {
      setIsTesting(true);
      const result = await testConnectionFn({
        data: {
          category: editingItem.category,
          credentials: editingItem.credentials
        }
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro no teste");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await saveIntegrationFn({ data: editingItem });
      toast.success("Configurações salvas");
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
  };

  const filtered = integrations?.filter(i => i.type === activeTab) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="h-4 w-4" style={{ color: ORANGE }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Sistema & Conexões</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white">
            Hub de <span style={{ color: ORANGE }}>Integrações</span>
          </h1>
          <p className="mt-2 text-sm text-white/50 max-w-2xl text-left">
            Gerencie todas as conexões externas, desde modelos de inteligência artificial até gateways de pagamento.
          </p>
        </div>
        
        <div className="flex items-center gap-1 rounded-sm border border-white/5 bg-black/40 p-1 self-start sm:self-auto">
          <button 
            onClick={() => setActiveTab('ia')}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'ia' ? 'bg-[#ff6a00] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            <BrainCircuit className="h-3.5 w-3.5" /> IA
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'payment' ? 'bg-[#ff6a00] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            <Wallet className="h-3.5 w-3.5" /> Pagamentos
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="group relative overflow-hidden border border-white/5 bg-[#111] p-5 transition hover:border-[#ff6a00]/30">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/5 text-[#ff6a00] transition group-hover:bg-[#ff6a00] group-hover:text-black">
                  {item.type === 'ia' ? <Sparkles className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateStatusMutation.mutate({ id: item.id, status: !item.status })}
                    className={`h-4 w-8 rounded-full transition-colors relative ${item.status ? 'bg-[#ff6a00]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all ${item.status ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                  {item.status ? 
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Online</span> :
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-white/20">Inativo</span>
                  }
                </div>
              </div>
              
              <h3 className="font-display text-base font-bold text-white mb-1 uppercase tracking-tight">{item.name}</h3>
              <p className="text-xs text-white/40 mb-6 line-clamp-2">Provedor de {item.type === 'ia' ? 'Inteligência Artificial' : 'Pagamentos'} ({item.category})</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">{item.category}</span>
                <button 
                  onClick={() => setEditingItem(item)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00] hover:brightness-125 flex items-center gap-1 transition"
                >
                  Configurar <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Configuração */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 my-8 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Configurar {editingItem.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Gerencie credenciais e definições técnicas</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/5 rounded-full transition"><XCircle className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Credentials Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Key className="h-3.5 w-3.5 text-[#ff6a00]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Credenciais</span>
                </div>
                
                {Object.keys(editingItem.credentials).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <input 
                      type="password"
                      value={editingItem.credentials[key]} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        credentials: { ...editingItem.credentials, [key]: e.target.value }
                      })} 
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
                    />
                  </div>
                ))}
              </div>

              {/* Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Globe className="h-3.5 w-3.5 text-[#ff6a00]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Configurações Gerais</span>
                </div>
                
                {Object.keys(editingItem.settings).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <input 
                      value={editingItem.settings[key]} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        settings: { ...editingItem.settings, [key]: e.target.value }
                      })} 
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-6 flex gap-3 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  Testar Conexão
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 rounded-xl bg-[#ff6a00] text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Info Card */}
      <div className="mt-12 flex items-center gap-4 border border-white/5 bg-white/[0.02] p-6 rounded-sm">
        <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-sm bg-[#ff6a00]/10 text-[#ff6a00]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="text-left">
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">Segurança de Dados</h4>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">
            Todas as API Keys e credenciais são criptografadas em nível de banco de dados. 
            Apenas usuários com privilégios administrativos podem gerenciar estas configurações.
          </p>
        </div>
      </div>
    </div>
  );
}

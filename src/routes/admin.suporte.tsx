import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/suporte")({
  head: () => ({ meta: [{ title: "Gestão de Suporte · Admin" }] }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  async function fetchTickets() {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          profiles:user_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar chamados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    const replyMessage = reply.trim();
    if (!replyMessage || !selectedTicket) return;

    try {
      setIsSending(true);
      // In a real system, we'd have a support_messages table. 
      // For now, we update the ticket status and log the reply in internal notes or similar
      // Or we just update the status to show movement.
      // Adicionar a mensagem de resposta
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          message: replyMessage,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          sender_type: 'support_agent'
        });

      if (msgError) throw msgError;

      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      toast.success("Resposta enviada (Simulado)");
      setReply("");
      fetchTickets();
    } catch (error: any) {
      toast.error("Erro ao responder: " + error.message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleResolve(id: string) {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Chamado resolvido");
      if (selectedTicket?.id === id) setSelectedTicket(null);
      fetchTickets();
    } catch (error: any) {
      toast.error("Erro ao fechar chamado: " + error.message);
    }
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Central de Suporte</h2>
          <p className="text-sm text-white/40">Gerencie os tickets e dúvidas dos alunos.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'open', label: 'Abertos' },
            { id: 'in_progress', label: 'Em Análise' },
            { id: 'resolved', label: 'Resolvidos' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${
                filter === t.id ? 'bg-[#ff6a00] text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Lista de Tickets */}
        <div className="lg:col-span-1 border border-white/5 bg-[#111] rounded-xl overflow-y-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#ff6a00]" />
            </div>
          ) : tickets.length > 0 ? (
            <div className="divide-y divide-white/5">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 text-left transition hover:bg-white/[0.02] ${
                    selectedTicket?.id === ticket.id ? 'bg-[#ff6a00]/5 border-l-2 border-[#ff6a00]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                      #{ticket.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h4 className="font-bold text-sm mb-1 line-clamp-1">{ticket.subject}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-tight mb-2">
                    {ticket.profiles?.name || 'Aluno'} · {ticket.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/20">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <ChevronRight className="h-3 w-3 text-white/20" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-8 w-8 text-white/10 mb-2" />
              <p className="text-xs text-white/20 uppercase font-bold tracking-widest">Nenhum chamado encontrado</p>
            </div>
          )}
        </div>

        {/* Detalhes do Ticket */}
        <div className="lg:col-span-2 border border-white/5 bg-[#111] rounded-xl flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-white/40">{selectedTicket.profiles?.name} ({selectedTicket.profiles?.email})</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-xs text-white/40 font-bold uppercase tracking-widest text-[10px]">{selectedTicket.category}</span>
                  </div>
                </div>
                {selectedTicket.status !== 'resolved' && (
                  <button 
                    onClick={() => handleResolve(selectedTicket.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                  </button>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-[#ff6a00]">Mensagem do Aluno</span>
                    <span className="text-[9px] text-white/20">{new Date(selectedTicket.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                </div>

                <div className="flex flex-col items-center justify-center py-8 text-white/10 italic">
                  <p className="text-[10px] uppercase tracking-widest font-bold">Histórico de mensagens simulado</p>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20">
                <form onSubmit={handleSendReply} className="relative">
                  <textarea
                    placeholder="Escreva sua resposta para o aluno..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-12 text-sm outline-none focus:border-[#ff6a00] transition min-h-[100px] resize-none"
                    disabled={selectedTicket.status === 'resolved'}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !reply.trim() || selectedTicket.status === 'resolved'}
                    className="absolute bottom-4 right-4 p-2 rounded-lg bg-[#ff6a00] text-black hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
                {selectedTicket.status === 'resolved' && (
                  <p className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-widest text-center mt-3">
                    Este chamado foi marcado como resolvido.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="font-bold text-lg mb-2">Nenhum Chamado Selecionado</h3>
              <p className="text-sm text-white/40 max-w-xs">Selecione um ticket na lista lateral para visualizar os detalhes e responder ao aluno.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    open: { label: 'Aberto', icon: AlertCircle, color: 'text-red-400 bg-red-400/10' },
    in_progress: { label: 'Em Análise', icon: Clock, color: 'text-amber-400 bg-amber-400/10' },
    resolved: { label: 'Resolvido', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10' },
  };

  const config = configs[status] || configs.open;
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${config.color}`}>
      <Icon className="h-3 w-3" /> {config.label}
    </span>
  );
}
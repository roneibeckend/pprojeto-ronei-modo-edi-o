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
  ChevronLeft,
  Send,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/suporte")({
  head: () => ({ meta: [{ title: "Gestão de Suporte · Admin" }] }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const { hasModule, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!authLoading && !hasModule("suporte")) {
      toast.error("Acesso negado: você não tem permissão para acessar o suporte.");
      navigate({ to: "/admin" });
    }
  }, [authLoading, hasModule, navigate]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  async function fetchMessages(ticketId: string) {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setTicketMessages(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar mensagens: " + error.message);
    } finally {
      setLoadingMessages(false);
    }
  }

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
      if (selectedTicket) fetchMessages(selectedTicket.id);
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

  async function handleDeleteTicket(id: string) {
    try {
      setLoading(true);
      
      await supabase
        .from('support_messages')
        .delete()
        .eq('ticket_id', id);

      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Chamado excluído permanentemente");
      if (selectedTicket?.id === id) setSelectedTicket(null);
      fetchTickets();
    } catch (error: any) {
      toast.error("Erro ao excluir chamado: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full lg:h-[calc(100vh-160px)] flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Central de Suporte</h2>
          <p className="text-xs sm:text-sm text-white/40">Gerencie os tickets e dúvidas dos alunos.</p>
        </div>
        
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 overflow-x-auto scrollbar-hidden">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'open', label: 'Abertos' },
            { id: 'in_progress', label: 'Análise' },
            { id: 'resolved', label: 'Resolvidos' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition shrink-0 ${
                filter === t.id ? 'bg-[#ff6a00] text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Lista de Tickets */}
        <div className={`lg:col-span-1 border border-white/5 bg-[#111] rounded-xl overflow-y-auto ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
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
                  className={`w-full p-4 sm:p-5 text-left transition hover:bg-white/[0.02] ${
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
        <div className={`lg:col-span-2 border border-white/5 bg-[#111] rounded-xl flex flex-col overflow-hidden ${selectedTicket ? 'block' : 'hidden lg:flex'}`}>
          {selectedTicket ? (
            <>
              <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.01] gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 -ml-2 text-white/40 hover:text-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg line-clamp-1">{selectedTicket.subject}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[10px] sm:text-xs text-white/40">{selectedTicket.profiles?.name}</span>
                      <span className="hidden sm:block h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest">{selectedTicket.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111] border-white/10 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          Esta ação é irreversível. O chamado e todo o histórico de mensagens serão removidos permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteTicket(selectedTicket.id)}
                          className="bg-red-500 text-white hover:bg-red-600 border-none"
                        >
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {selectedTicket.status !== 'resolved' && (
                    <button 
                      onClick={() => handleResolve(selectedTicket.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#ff6a00]" />
                  </div>
                ) : ticketMessages.length > 0 ? (
                  ticketMessages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.sender_type === 'support_agent' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.sender_type === 'support_agent' 
                          ? 'bg-[#ff6a00] text-black font-medium rounded-tr-none' 
                          : 'bg-white/10 text-white rounded-tl-none'
                      }`}>
                        {m.message}
                      </div>
                      <span className="mt-1 text-[9px] text-white/20 uppercase font-bold">
                        {new Date(m.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-white/20 uppercase text-[10px] font-bold tracking-widest">
                    Nenhuma mensagem neste chamado.
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20">
                <form onSubmit={handleSendReply} className="relative">
                  <textarea
                    placeholder="Escreva sua resposta para o aluno..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-12 text-sm outline-none focus:border-[#ff6a00] transition min-h-[100px] resize-none text-[16px]"
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
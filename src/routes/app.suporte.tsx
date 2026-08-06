import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Flame, 
  Send, 
  MessageCircle, 
  Ticket as TicketIcon, 
  ChevronRight, 
  User, 
  HelpCircle,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { supportQuestions } from "@/lib/platform-data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/suporte")({
  head: () => ({ meta: [{ title: "Suporte e Central de Ajuda — Espetinho na Veia" }] }),
  component: SupportPage,
});

type Msg = { role: "user" | "ai"; text: string; time: string };

function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"chat" | "tickets">("chat");
  const [messages, setMessages] = useState<Msg[]>([
    { 
      role: "ai", 
      text: "Oi! Eu sou a Brasa, sua assistente da plataforma. Como posso te ajudar hoje?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [isOpeningTicket, setIsOpeningTicket] = useState(false);

  // Buscar tickets do banco
  const { data: myTickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "chat") {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, activeTab]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((m) => [...m, { role: "user", text, time: now }]);
    setInput("");
    setTyping(true);
    
    setTimeout(() => {
      const match = supportQuestions.find((q) => q.q.toLowerCase() === text.toLowerCase());
      const answer = match?.a ?? "Entendi! Essa é uma dúvida importante. Nossa equipe humana também foi notificada e vai te responder em breve caso eu não tenha a resposta exata aqui. Enquanto isso, posso ajudar com algo mais?";
      setMessages((m) => [...m, { 
        role: "ai", 
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setTyping(false);
    }, 1200);
  };

  const handleOpenTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const category = formData.get("category") as string;
    const message = formData.get("message") as string;
    
    try {
      // 1. Criar o ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject,
          category,
          status: "Aberto",
          priority: "normal"
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Criar a primeira mensagem
      const { error: msgError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          message,
          sender_id: user.id,
          sender_type: "user"
        });

      if (msgError) throw msgError;

      toast.success("Seu chamado foi enviado para a equipe do Ronnei!", {
        description: `Protocolo: ${ticket.id.slice(0, 8)}`
      });
      
      setIsOpeningTicket(false);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    } catch (error: any) {
      toast.error("Erro ao abrir chamado: " + error.message);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="Central de Suporte"
        subtitle="Escolha como deseja ser atendido hoje."
      />

      {/* Tabs Navigation */}
      <div className="mb-8 flex gap-2">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-widest transition ${
            activeTab === "chat" 
              ? "bg-[#ff6a00] text-black shadow-lg shadow-[#ff6a00]/20" 
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Chat com a Brasa
        </button>
        <button 
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-widest transition ${
            activeTab === "tickets" 
              ? "bg-[#ff6a00] text-black shadow-lg shadow-[#ff6a00]/20" 
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Ticket className="h-4 w-4" />
          Meus Chamados
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main Content Area */}
        <div className="min-h-[600px]">
          {activeTab === "chat" ? (
            <section className="glass flex h-[650px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#ff6a00] to-[#ff9500] shadow-lg shadow-[#ff6a00]/20">
                      <Flame className="h-6 w-6 text-black" strokeWidth={2.5} />
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-[#0a0a0a] bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">Brasa</h3>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Assistente Online
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <span className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Atendimento Inteligente
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-6 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                      {m.role === "ai" && (
                        <div className="mb-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 sm:flex">
                          <Flame className="h-4 w-4 text-[#ff6a00]" />
                        </div>
                      )}
                      <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                        m.role === "user" 
                          ? "bg-[#ff6a00] text-black font-medium rounded-tr-none" 
                          : "bg-white/5 text-white/90 border border-white/5 rounded-tl-none"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                    <span className="mt-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                      {m.time}
                    </span>
                  </div>
                ))}
                
                {typing && (
                  <div className="flex items-start gap-2">
                    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 sm:flex">
                      <Flame className="h-4 w-4 text-[#ff6a00]" />
                    </div>
                    <div className="flex gap-1 rounded-2xl bg-white/5 px-5 py-4 border border-white/5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/20" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/20 [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/20 [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-white/5 bg-white/[0.01] p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="relative flex items-center"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escreva sua pergunta aqui..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-6 pr-16 text-sm outline-none transition-all placeholder:text-white/20 focus:border-[#ff6a00]/50 focus:bg-white/10"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="absolute right-2 grid h-10 w-10 place-items-center rounded-xl bg-[#ff6a00] text-black shadow-lg shadow-[#ff6a00]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    aria-label="Enviar"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="mt-3 text-center text-[10px] font-medium text-white/20 uppercase tracking-[0.15em]">
                  Respostas instantâneas baseadas no conteúdo do curso
                </p>
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              {/* Ticket Creation Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ff6a00]/20 bg-[#ff6a00]/5 p-6 lg:p-8">
                <div className="max-w-md">
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <PlusCircle className="h-6 w-6 text-[#ff6a00]" />
                    Precisa de ajuda humana?
                  </h3>
                  <p className="mt-1 text-sm text-white/50 leading-relaxed">
                    Abra um chamado direto para a equipe do Ronnei. Respondemos em até 24 horas úteis.
                  </p>
                </div>
                {!isOpeningTicket && (
                  <button 
                    onClick={() => setIsOpeningTicket(true)}
                    className="btn-fire px-8 py-3.5 text-sm font-bold uppercase tracking-widest whitespace-nowrap"
                  >
                    Abrir Novo Chamado
                  </button>
                )}
              </div>

              {/* Ticket Form */}
              {isOpeningTicket && (
                <div className="glass rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8 animate-in zoom-in-95 duration-300">
                  <div className="mb-8 flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold text-white">Novo Ticket de Suporte</h4>
                    <button 
                      onClick={() => setIsOpeningTicket(false)}
                      className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition"
                    >
                      Cancelar
                    </button>
                  </div>
                  <form onSubmit={handleOpenTicket} className="grid gap-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Assunto</label>
                        <input 
                          name="subject"
                          required
                          placeholder="Ex: Dúvida sobre finalização de espeto"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#ff6a00]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Categoria</label>
                        <select 
                          name="category"
                          required
                          className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm outline-none focus:border-[#ff6a00]"
                        >
                          <option value="Dúvida Técnica">Dúvida Técnica (Receitas)</option>
                          <option value="Acesso">Acesso à Plataforma</option>
                          <option value="Financeiro">Financeiro / Pagamentos</option>
                          <option value="Outros">Sugestões / Outros</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Sua Mensagem</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Descreva detalhadamente como podemos te ajudar..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#ff6a00] resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="btn-fire w-full sm:w-auto px-10 py-4 text-sm font-bold uppercase tracking-widest">
                        Enviar para Equipe
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tickets List */}
              <div className="glass overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                  <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white/60">Histórico de Chamados</h4>
                </div>
                <div className="divide-y divide-white/5">
                  {myTickets.map((t) => (
                    <div key={t.id} className="group flex flex-wrap items-center justify-between gap-4 p-6 transition-colors hover:bg-white/[0.03]">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 grid h-10 w-10 place-items-center rounded-xl bg-white/5 transition group-hover:bg-white/10 ${
                          t.status === "Respondido" ? "text-emerald-500" : "text-[#ff6a00]"
                        }`}>
                          {t.status === "Respondido" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] font-bold text-[#ff6a00] uppercase tracking-widest">{t.id}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">{t.category}</span>
                          </div>
                          <h5 className="mt-1 font-bold text-white group-hover:text-[#ff6a00] transition">{t.subject}</h5>
                          <div className="mt-2 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.date}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> Equipe do Ronnei</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                            t.status === "Respondido" ? "text-emerald-500" : "text-[#ff6a00]"
                          }`}>
                            {t.status}
                          </div>
                          <div className="mt-1 text-[10px] font-medium text-white/20 uppercase tracking-widest">
                            Atualizado {t.lastUpdate}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/40 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Context */}
        <aside className="space-y-8">
          {/* FAQ / Fast Support */}
          <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-[#ff6a00]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h4 className="font-display text-lg font-bold text-white uppercase tracking-wide">Dúvidas Rápidas</h4>
            </div>
            
            <div className="grid gap-3">
              {supportQuestions.slice(0, 5).map((q) => (
                <button
                  key={q.q}
                  onClick={() => {
                    setActiveTab("chat");
                    send(q.q);
                  }}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left transition hover:border-[#ff6a00]/30 hover:bg-[#ff6a00]/5"
                >
                  <span className="text-sm font-medium text-white/60 group-hover:text-white transition line-clamp-2">
                    {q.q}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/10 group-hover:text-[#ff6a00] transition" />
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-white/20 font-medium italic">
              "A dúvida de um é o sucesso de todos."
            </p>
          </section>

          {/* Social / Contact Info */}
          <section className="glass space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 rounded-xl bg-[#ff6a00]/10 p-4">
              <AlertCircle className="h-5 w-5 text-[#ff6a00]" />
              <div className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] leading-snug">
                Horário de Atendimento Humano
              </div>
            </div>
            <div className="space-y-3 px-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-white/30">Segunda à Sexta</span>
                <span className="text-white/60">09h às 18h</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-white/30">Sábado</span>
                <span className="text-white/60">09h às 12h</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

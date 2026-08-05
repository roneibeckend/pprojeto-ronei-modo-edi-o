import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Flame, Send, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { supportQuestions } from "@/lib/platform-data";
import { useProfile, useSupportTicket, useSendMessage, useSendAIMessage } from "@/hooks/use-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/app/suporte")({
  head: () => ({ meta: [{ title: "Suporte — Espetinho na Veia" }] }),
  component: SupportPage,
});

type MessageUI = {
  role: "user" | "ai";
  text: string;
  id?: string;
};

function SupportPage() {
  const { data: profile } = useProfile();
  const { data: ticket, isLoading: loadingTicket } = useSupportTicket();
  const sendMessage = useSendMessage();
  const sendAIMessage = useSendAIMessage();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const messages: MessageUI[] = ticket?.messages?.map(m => ({
    role: m.sender_type === "student" ? "user" as const : "ai" as const,
    text: m.message,
    id: m.id
  })) || [{ role: "ai" as const, text: "Oi! Eu sou a Brasa, sua assistente da plataforma. Como posso te ajudar hoje?" }];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || sendMessage.isPending || isTyping) return;
    
    try {
      const ticketId = await sendMessage.mutateAsync({ message: text });
      setInput("");
      setIsTyping(true);

      const match = supportQuestions.find((q) => q.q.toLowerCase() === text.toLowerCase());
      const answer = match?.a ?? "Boa pergunta! Nossa equipe vai te responder por aqui em breve. Enquanto isso, veja se uma das dúvidas frequentes ao lado ajuda.";
      
      setTimeout(async () => {
        try {
          await sendAIMessage.mutateAsync({ ticketId, message: answer });
        } catch (err) {
          console.error("Erro ao salvar resposta da Brasa:", err);
        } finally {
          setIsTyping(false);
        }
      }, 1500);
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <div>
      <PageHeader
        title="Suporte com a Brasa"
        subtitle="Dúvidas frequentes — clique em uma pergunta ou converse com a Brasa, nossa assistente inteligente."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <aside className="glass rounded-2xl p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Dúvidas frequentes</div>
          <ul className="space-y-2">
            {supportQuestions.map((q) => (
              <li key={q.q}>
                <button
                  onClick={() => handleSend(q.q)}
                  disabled={sendMessage.isPending || isTyping}
                  className="w-full rounded-xl border border-white/5 p-3 text-left text-sm transition hover:border-primary/40 hover:bg-fire/10 disabled:opacity-50"
                >
                  {q.q}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="glass flex h-[600px] flex-col rounded-2xl relative">
          <div className="flex items-center gap-3 border-b border-white/5 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-fire shadow-fire">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">Brasa</div>
              <div className="text-xs text-muted-foreground">Assistente inteligente · online</div>
            </div>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loadingTicket ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-fire" />
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user" ? "bg-fire text-white" : "bg-white/5"
                  }`}>{m.text}</div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                  <span className="inline-block animate-pulse">Brasa está digitando...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2 border-t border-white/5 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sendMessage.isPending || isTyping}
              placeholder="Escreva sua pergunta..."
              className="flex-1 rounded-full border border-white/10 bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || sendMessage.isPending || isTyping}
              className="btn-fire text-sm disabled:opacity-50" 
              aria-label="Enviar"
            >
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

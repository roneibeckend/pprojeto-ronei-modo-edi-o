import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Flame, Send } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { supportQuestions } from "@/lib/platform-data";

export const Route = createFileRoute("/app/suporte")({
  head: () => ({ meta: [{ title: "Suporte — Espetinho na Veia" }] }),
  component: SupportPage,
});

type Msg = { role: "user" | "ai"; text: string };

function SupportPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Oi! Eu sou a Brasa, sua assistente da plataforma. Como posso te ajudar hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    const match = supportQuestions.find((q) => q.q.toLowerCase() === text.toLowerCase());
    const answer = match?.a ?? "Boa pergunta! Nossa equipe vai te responder por aqui em breve. Enquanto isso, veja se uma das dúvidas frequentes ao lado ajuda.";
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: answer }]);
      setTyping(false);
    }, 900);
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
                  onClick={() => send(q.q)}
                  className="w-full rounded-xl border border-white/5 p-3 text-left text-sm transition hover:border-primary/40 hover:bg-fire/10"
                >
                  {q.q}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="glass flex h-[600px] flex-col rounded-2xl">
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
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-fire text-white" : "bg-white/5"
                }`}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                  <span className="inline-block animate-pulse">Brasa está digitando...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 border-t border-white/5 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua pergunta..."
              className="flex-1 rounded-full border border-white/10 bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="btn-fire text-sm" aria-label="Enviar">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

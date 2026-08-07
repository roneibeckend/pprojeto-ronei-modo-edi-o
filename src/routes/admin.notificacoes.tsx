import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Send, Info, Library, Clapperboard, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notificacoes")({
  component: AdminNotifications,
});

const ORANGE = "#ff6a00";

type NotificationType = "general" | "course" | "lesson" | "live";

function AdminNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("general");
  const [targetType, setTargetType] = useState<"all" | "segmented">("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Preencha o título e a mensagem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        title,
        message,
        type,
        target_type: targetType,
        sent_by: user?.id,
      });

      if (error) throw error;

      toast.success("Notificação enviada com sucesso!");
      setTitle("");
      setMessage("");
    } catch (error: any) {
      console.error("Erro ao enviar notificação:", error);
      toast.error("Erro ao enviar notificação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { value: "general", label: "Novidade Geral", icon: Info, color: "text-blue-400" },
    { value: "course", label: "Novo Curso", icon: Library, color: "text-purple-400" },
    { value: "lesson", label: "Nova Aula", icon: Play, color: "text-green-400" },
    { value: "live", label: "Aula ao Vivo", icon: Clapperboard, color: "text-red-400" },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" style={{ color: ORANGE }} />
          Enviar Notificação Push
        </h2>
        <p className="text-white/60 mt-2">
          Comunique-se diretamente com seus alunos enviando atualizações importantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Título da Notificação</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nova aula disponível!"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff6a00] transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o que há de novo..."
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff6a00] transition resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Tipo de Notificação</label>
            <div className="grid grid-cols-2 gap-3">
              {notificationTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value as NotificationType)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition text-left ${
                    type === t.value
                      ? "bg-[#ff6a00]/10 border-[#ff6a00] text-[#ff6a00]"
                      : "bg-black/20 border-white/5 text-white/60 hover:border-white/20"
                  }`}
                >
                  <t.icon className={`h-5 w-5 ${type === t.value ? "text-[#ff6a00]" : t.color}`} />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6a00] hover:bg-[#e65f00] disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-[#ff6a00]/20"
            >
              {loading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Enviar para todos os alunos
                </>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#ff6a00]" />
              Pré-visualização
            </h3>
            <div className="bg-black/60 rounded-xl p-4 border border-white/5 space-y-2 shadow-2xl">
              <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                <Bell className="h-3 w-3" /> App Lovable • Agora
              </div>
              <div className="font-bold text-sm">{title || "Título da Mensagem"}</div>
              <div className="text-xs text-white/60 line-clamp-2">{message || "O conteúdo da sua notificação aparecerá aqui para os alunos."}</div>
            </div>
          </div>

          <div className="bg-[#ff6a00]/5 p-6 rounded-2xl border border-[#ff6a00]/20 space-y-4">
            <h3 className="font-bold text-sm text-[#ff6a00]">Dicas de Engajamento</h3>
            <ul className="text-xs space-y-3 text-white/60">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#ff6a00] shrink-0" />
                Seja direto e use gatilhos de curiosidade.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#ff6a00] shrink-0" />
                Use emojis para tornar a mensagem mais amigável.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#ff6a00] shrink-0" />
                Notifique apenas sobre atualizações realmente relevantes.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
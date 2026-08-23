import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Send, Eye, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ORANGE = "#ff6a00";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "fix", label: "Correção" },
  { value: "improvement", label: "Melhoria" },
  { value: "feature", label: "Novidade" },
  { value: "security", label: "Segurança" },
];

const IMPACTS: { value: string; label: string }[] = [
  { value: "low", label: "Baixo" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alto" },
];

type UpdateRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  impact: string;
  released_at: string;
};

export default function SystemUpdatesPanel() {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "fix", impact: "normal" });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const [updatesRes, logsRes] = await Promise.all([
        supabase
          .from("system_updates")
          .select("id, title, description, category, impact, released_at")
          .order("released_at", { ascending: false })
          .limit(30),
        supabase
          .from("update_report_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (updatesRes.error) throw updatesRes.error;
      setUpdates((updatesRes.data || []) as UpdateRow[]);
      setLogs(logsRes.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar atualizações: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Informe o título da atualização.");
    try {
      setSaving(true);
      const { data: session } = await supabase.auth.getUser();
      const { error } = await supabase.from("system_updates").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        impact: form.impact,
        created_by: session.user?.id || null,
      });
      if (error) throw error;
      toast.success("Atualização registrada! Entrará no relatório das 10:00.");
      setForm({ title: "", description: "", category: "fix", impact: "normal" });
      void load();
    } catch (error: any) {
      toast.error("Erro ao registrar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("system_updates").delete().eq("id", id);
      if (error) throw error;
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      toast.success("Atualização removida.");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  }

  async function callReport(body: Record<string, unknown>) {
    const session = await supabase.auth.getSession();
    const response = await fetch("/api/public/daily-updates-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.data.session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `Falha (${response.status})`);
    return payload;
  }

  async function handlePreview() {
    try {
      setSending(true);
      const payload = await callReport({ preview: true });
      setPreviewHtml(payload?.data?.html || "");
    } catch (error: any) {
      toast.error("Erro na pré-visualização: " + error.message);
    } finally {
      setSending(false);
    }
  }

  async function handleSendNow() {
    try {
      setSending(true);
      const payload = await callReport({ test: true });
      const failed = (payload?.results || []).filter((r: any) => r.status === "failed");
      if (failed.length) throw new Error(failed[0].error || "O provedor recusou o envio.");
      if (!payload?.results?.length) throw new Error("Nenhum destinatário ativo cadastrado.");
      toast.success("Relatório de atualizações enviado!");
      void load();
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="border border-white/5 bg-[#111] p-6 rounded-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
          <Sparkles className="h-4 w-4" style={{ color: ORANGE }} /> Registro de Atualizações
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePreview}
            disabled={sending}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/60 uppercase tracking-widest hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <Eye className="h-3 w-3" /> Pré-visualizar
          </button>
          <button
            onClick={handleSendNow}
            disabled={sending}
            className="flex items-center gap-2 bg-[#ff6a00] px-3 py-1.5 rounded-lg text-[10px] font-bold text-black uppercase tracking-widest disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Enviar agora
          </button>
        </div>
      </div>

      <p className="text-[10px] text-white/40 leading-relaxed mb-5">
        Toda atualização registrada aqui entra no relatório automático enviado às 10:00 (Brasília) para os
        mesmos destinatários dos relatórios financeiros.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-left mb-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Corrigimos o vídeo que não abria no mobile"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#ff6a00]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Detalhe o que mudou e qual o impacto para o aluno."
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#ff6a00] resize-y"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tipo</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#ff6a00]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#111]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Impacto</label>
            <select
              value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#ff6a00]"
            >
              {IMPACTS.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#111]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#ff6a00] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:opacity-90 transition disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Registrar atualização
        </button>
      </form>

      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Últimas atualizações</div>
        {loading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff6a00]" />
          </div>
        ) : updates.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl text-[10px] text-white/20 uppercase tracking-widest">
            Nenhuma atualização registrada.
          </div>
        ) : (
          updates.map((u) => (
            <div
              key={u.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-white/5 bg-black/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff6a00]">
                    {CATEGORIES.find((c) => c.value === u.category)?.label || u.category}
                  </span>
                  <span className="text-[9px] text-white/30">
                    {new Date(u.released_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </span>
                </div>
                <p className="text-sm font-bold mt-1 break-words">{u.title}</p>
                {u.description && <p className="text-xs text-white/40 mt-0.5 break-words">{u.description}</p>}
              </div>
              <button
                onClick={() => handleDelete(u.id)}
                className="p-1.5 rounded hover:bg-white/5 text-white/20 hover:text-red-400 transition shrink-0"
                title="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {logs.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Envios recentes</div>
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-2 text-[10px] text-white/40">
              <span className="font-mono">{log.recipient_email || "—"}</span>
              <span className={log.status === "sent" ? "text-emerald-400" : "text-red-400"}>
                {log.status === "sent" ? `Enviado (${log.updates_count})` : log.error || "Falha"}
              </span>
            </div>
          ))}
        </div>
      )}

      {previewHtml !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl h-[85dvh] bg-[#0e0e0e] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-sm font-bold">Pré-visualização do relatório</h3>
              <button onClick={() => setPreviewHtml(null)} className="p-2 hover:bg-white/5 rounded-full transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <iframe title="Pré-visualização" srcDoc={previewHtml} className="flex-1 w-full bg-white" />
          </div>
        </div>
      )}
    </section>
  );
}

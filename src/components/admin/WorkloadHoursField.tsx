import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, RefreshCw, Check, Loader2, ChevronDown } from "lucide-react";
import { suggestWorkloadHours } from "@/lib/workload.functions";
import type { WorkloadSuggestion, WorkloadExtras } from "@/lib/workload.server";
import { cn } from "@/lib/utils";

type Props = {
  contentId?: string;
  contentType: "course" | "ebook";
  hours?: number | null;
  extras?: WorkloadExtras | null;
  onChange: (patch: { workload_hours?: number | null; workload_extras?: WorkloadExtras }) => void;
};

const EXTRA_FIELDS: { key: keyof WorkloadExtras; label: string }[] = [
  { key: "exercises", label: "Exercícios" },
  { key: "checklists", label: "Checklists" },
  { key: "spreadsheets", label: "Planilhas" },
  { key: "materials", label: "Materiais compl." },
  { key: "practices", label: "Atividades práticas" },
];

export function WorkloadHoursField({ contentId, contentType, hours, extras, onChange }: Props) {
  const suggest = useServerFn(suggestWorkloadHours);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<WorkloadSuggestion | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const currentExtras: WorkloadExtras = extras || {};

  async function recalculate() {
    if (!contentId) {
      toast.error("Salve o produto antes de calcular a carga horária.");
      return;
    }
    try {
      setLoading(true);
      const result = await suggest({
        data: { contentId, contentType, extras: currentExtras },
      });
      setSuggestion(result);
      setShowDetails(true);
      toast.success(`Sugestão: ${result.hours} horas (${result.minHours}–${result.maxHours}h)`);
    } catch (error: any) {
      toast.error("Erro ao calcular carga horária: " + (error?.message || "tente novamente"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
          <Clock className="h-3.5 w-3.5" /> Carga Horária
        </div>
        <button
          type="button"
          onClick={recalculate}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:border-[#ff6a00] hover:text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recalcular
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-white/30">Horas (manual)</label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Automático"
            value={hours ?? ""}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              onChange({ workload_hours: Number.isFinite(v) && v > 0 ? v : null });
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none transition-colors focus:border-[#ff6a00]"
          />
          <p className="text-[10px] text-white/25">
            Em branco: usa a sugestão automática nos certificados.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-white/30">Sugestão</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-white/10 bg-black/40 p-3 text-sm">
              {suggestion ? (
                <span className="font-bold text-[#ff6a00]">
                  {suggestion.hours} horas{" "}
                  <span className="font-normal text-white/40">
                    ({suggestion.minHours}–{suggestion.maxHours}h)
                  </span>
                </span>
              ) : (
                <span className="text-white/30">Clique em recalcular</span>
              )}
            </div>
            {suggestion && (
              <button
                type="button"
                onClick={() => {
                  onChange({ workload_hours: suggestion.hours });
                  toast.success("Sugestão aplicada.");
                }}
                className="flex items-center gap-1 rounded-lg bg-[#ff6a00] px-3 py-3 text-xs font-bold text-black transition-colors hover:bg-[#ff8c33]"
              >
                <Check className="h-3.5 w-3.5" /> Aceitar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {EXTRA_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-white/30">{f.label}</label>
            <input
              type="number"
              min="0"
              step="1"
              value={currentExtras[f.key] ?? ""}
              placeholder="auto"
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                const next = { ...currentExtras };
                if (Number.isFinite(v) && v >= 0) next[f.key] = v;
                else delete next[f.key];
                onChange({ workload_extras: next });
              }}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm outline-none transition-colors focus:border-[#ff6a00]"
            />
          </div>
        ))}
      </div>

      {suggestion && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-180")} />
            Como foi calculado
          </button>
          {showDetails && (
            <ul className="mt-2 space-y-1 text-xs text-white/50">
              {suggestion.breakdown.map((b) => (
                <li key={b.label} className="flex items-center justify-between gap-3">
                  <span>{b.label}</span>
                  <span className="text-white/70">{Math.round((b.minutes / 60) * 10) / 10} h</span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 border-t border-white/10 pt-1 font-bold text-white/80">
                <span>Total</span>
                <span>{suggestion.hours} h</span>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

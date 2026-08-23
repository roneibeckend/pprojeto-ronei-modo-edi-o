import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BadgeCheck,
  Clock,
  Loader2,
  MailWarning,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getEmailVerificationOverview } from "@/lib/email-verification.functions";

type StatusFilter = "all" | "verified" | "pending";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "verified", label: "Confirmados" },
  { id: "pending", label: "Pendentes" },
];

const EVENT_STYLES = {
  confirmed: { label: "Confirmado", cls: "text-emerald-400 bg-emerald-500/10", Icon: BadgeCheck },
  pending: { label: "Aguardando", cls: "text-yellow-400 bg-yellow-500/10", Icon: Clock },
  expired: { label: "Expirado", cls: "text-white/40 bg-white/5", Icon: XCircle },
} as const;

function fmt(value: string | null) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function EmailVerificationsPanel() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const overviewFn = useServerFn(getEmailVerificationOverview);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-email-verifications", status, search],
    queryFn: async () =>
      (await overviewFn({ data: { status, search: search.trim() || undefined, limit: 50 } })) as any,
  });

  return (
    <section className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#ff6a00]" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              Verificação de e-mails
            </h3>
            <p className="mt-1 text-[11px] text-white/40">
              Situação da confirmação de e-mail dos usuários e últimos eventos de verificação.
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex min-h-[40px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[11px] font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70">
            Confirmados
          </div>
          <div className="mt-1 text-2xl font-black text-white">
            {isLoading ? "—" : (data?.totals?.verified ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-300/70">
            Pendentes
          </div>
          <div className="mt-1 text-2xl font-black text-white">
            {isLoading ? "—" : (data?.totals?.pending ?? 0)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition ${
                status === f.id
                  ? "border-[#ff6a00]/50 bg-[#ff6a00]/10 text-[#ff6a00]"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#ff6a00]/40 focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300">
          <MailWarning className="h-4 w-4" /> {(error as any)?.message || "Erro ao carregar dados."}
        </div>
      ) : isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#ff6a00]" />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-white/5">
            <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Usuários ({data?.users?.length ?? 0})
            </div>
            <div className="max-h-[420px] divide-y divide-white/5 overflow-y-auto">
              {(data?.users ?? []).length === 0 && (
                <div className="p-6 text-center text-xs text-white/40">Nenhum usuário encontrado.</div>
              )}
              {(data?.users ?? []).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">
                      {u.name || "Sem nome"}
                    </div>
                    <div className="truncate text-[11px] text-white/40">{u.email || "—"}</div>
                  </div>
                  {u.verifiedAt ? (
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                        <BadgeCheck className="h-3 w-3" /> Confirmado
                      </span>
                      <div className="mt-1 text-[10px] text-white/30">{fmt(u.verifiedAt)}</div>
                    </div>
                  ) : (
                    <span className="shrink-0 rounded-full bg-yellow-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                      Pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5">
            <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Últimos eventos
            </div>
            <div className="max-h-[420px] divide-y divide-white/5 overflow-y-auto">
              {(data?.events ?? []).length === 0 && (
                <div className="p-6 text-center text-xs text-white/40">Nenhum evento registrado.</div>
              )}
              {(data?.events ?? []).map((e: any) => {
                const style = EVENT_STYLES[e.state as keyof typeof EVENT_STYLES] ?? EVENT_STYLES.pending;
                const Icon = style.Icon;
                return (
                  <div key={e.id} className="flex items-start gap-3 p-4">
                    <span className={`mt-0.5 rounded-lg p-1.5 ${style.cls}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-bold text-white">{e.email}</div>
                      <div className="text-[10px] text-white/40">
                        {style.label} · enviado {fmt(e.createdAt)}
                        {e.consumedAt ? ` · confirmado ${fmt(e.consumedAt)}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

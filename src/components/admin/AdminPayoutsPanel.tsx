import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileUp,
  History,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import {
  adminListPayouts,
  adminRequestPayoutDocument,
  adminUpdatePayoutStatus,
  getPayoutAuditLog,
  getPayoutDocumentUrl,
} from "@/lib/payouts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
  analyzing: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500", icon: Loader2 },
  approved: { label: "Aprovado", color: "bg-indigo-500/10 text-indigo-500", icon: CheckCircle2 },
  paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
  rejected: { label: "Recusado", color: "bg-red-500/10 text-red-500", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-white/10 text-white/50", icon: XCircle },
} as const;

type StatusKey = keyof typeof STATUS;

const FILTERS: Array<[StatusKey | "all", string]> = [
  ["all", "Todos"],
  ["pending", "Pendentes"],
  ["analyzing", "Em análise"],
  ["approved", "Aprovados"],
  ["paid", "Pagos"],
  ["rejected", "Recusados"],
  ["cancelled", "Cancelados"],
];

export function AdminPayoutsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [docOpen, setDocOpen] = useState(false);

  const listFn = useServerFn(adminListPayouts);
  const updateFn = useServerFn(adminUpdatePayoutStatus);
  const requestDocFn = useServerFn(adminRequestPayoutDocument);
  const docUrlFn = useServerFn(getPayoutDocumentUrl);
  const auditFn = useServerFn(getPayoutAuditLog);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payout-requests-full"],
    queryFn: async () => (await listFn()) as any[],
  });

  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ["payout-audit", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => (await auditFn({ data: { payoutId: selected.id } })) as any[],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-payout-requests-full"] });
    queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin-asaas-transfers"] });
    queryClient.invalidateQueries({ queryKey: ["payout-audit"] });
  };

  const statusMutation = useMutation({
    mutationFn: async (vars: { payoutId: string; status: StatusKey; rejectionReason?: string }) =>
      updateFn({
        data: {
          payoutId: vars.payoutId,
          status: vars.status,
          ...(vars.rejectionReason ? { rejectionReason: vars.rejectionReason } : {}),
        },
      }),
    onSuccess: (_res, vars) => {
      toast.success(`Saque atualizado para "${STATUS[vars.status].label}".`);
      setRejectOpen(false);
      setRejectReason("");
      setSelected(null);
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao atualizar status."),
  });

  const requestDocMutation = useMutation({
    mutationFn: async (vars: { payoutId: string; notes?: string }) =>
      requestDocFn({ data: { payoutId: vars.payoutId, ...(vars.notes ? { notes: vars.notes } : {}) } }),
    onSuccess: () => {
      toast.success("Novo documento solicitado ao usuário.");
      setDocOpen(false);
      setDocNotes("");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao solicitar documento."),
  });

  const viewDocMutation = useMutation({
    mutationFn: async (payoutId: string) => docUrlFn({ data: { payoutId } }),
    onSuccess: (res: any) => {
      if (res?.url) window.open(res.url, "_blank", "noopener,noreferrer");
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao abrir documento."),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (payouts || []).filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!term) return true;
      const profile = p.profiles || p.profile || {};
      return (
        (profile.name || "").toLowerCase().includes(term) ||
        (profile.email || "").toLowerCase().includes(term) ||
        (p.pix_key || "").toLowerCase().includes(term)
      );
    });
  }, [payouts, statusFilter, search]);

  return (
    <div className="space-y-4">
      <div className="border border-white/5 bg-white/[0.02] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-full border transition min-h-[36px] ${
                statusFilter === key
                  ? "bg-fire text-white border-fire"
                  : "border-white/10 text-white/60 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar por nome, e-mail ou chave PIX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <div className="border border-white/5 rounded-2xl bg-[#111] overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-fire inline" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/40 text-sm">
            Nenhuma solicitação encontrada para este filtro.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((p) => {
              const status = STATUS[p.status as StatusKey] || STATUS.pending;
              const profile = p.profiles || p.profile || {};
              return (
                <li key={p.id} className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{profile.name || "Usuário"}</div>
                      <div className="text-[11px] text-white/40 truncate">{profile.email || "-"}</div>
                      <div className="text-[11px] text-white/40 mt-1 break-all">
                        PIX: {p.pix_key || "-"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-400">R$ {brl(Number(p.amount))}</div>
                      <div className="text-[10px] text-white/40">
                        {p.created_at ? new Date(p.created_at).toLocaleString("pt-BR") : "-"}
                      </div>
                      <span
                        className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color}`}
                      >
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {p.document_status === "requested" && (
                    <p className="text-[11px] text-yellow-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Novo documento solicitado ao usuário.
                    </p>
                  )}
                  {p.status === "rejected" && p.rejection_reason && (
                    <p className="text-[11px] text-red-400/80">Motivo: {p.rejection_reason}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 min-h-[38px]"
                      disabled={!p.document_url || viewDocMutation.isPending}
                      onClick={() => viewDocMutation.mutate(p.id)}
                    >
                      <Eye className="w-3.5 h-3.5" /> Documento
                    </Button>

                    {["pending", "analyzing", "approved"].includes(p.status) && (
                      <>
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/30 text-blue-400 min-h-[38px]"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ payoutId: p.id, status: "analyzing" })
                            }
                          >
                            Em análise
                          </Button>
                        )}
                        {p.status !== "approved" && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 min-h-[38px]"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ payoutId: p.id, status: "approved" })
                            }
                          >
                            Aprovar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 min-h-[38px]"
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Confirme que o PIX já foi enviado manualmente para este saque. Esta baixa não dispara nenhuma transferência automática.",
                              )
                            ) {
                              statusMutation.mutate({ payoutId: p.id, status: "paid" });
                            }
                          }}
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Marcar como pago"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 min-h-[38px]"
                          onClick={() => {
                            setSelected(p);
                            setRejectOpen(true);
                          }}
                        >
                          Recusar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500/30 text-yellow-500 min-h-[38px]"
                          onClick={() => {
                            setSelected(p);
                            setDocOpen(true);
                          }}
                        >
                          <FileUp className="w-3.5 h-3.5" /> Pedir documento
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 min-h-[38px]"
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                    >
                      <History className="w-3.5 h-3.5" /> Auditoria
                    </Button>
                  </div>

                  {selected?.id === p.id && !rejectOpen && !docOpen && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                        Trilha de auditoria
                      </div>
                      {auditLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-fire" />
                      ) : !auditLog || auditLog.length === 0 ? (
                        <p className="text-xs text-white/40 italic">Nenhum registro ainda.</p>
                      ) : (
                        <ul className="space-y-2">
                          {auditLog.map((log) => (
                            <li key={log.id} className="text-[11px] text-white/60 flex gap-2">
                              <span className="text-white/30 shrink-0">
                                {new Date(log.created_at).toLocaleString("pt-BR")}
                              </span>
                              <span className="font-bold text-white/80">{log.action}</span>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <span className="text-white/40 break-all">
                                  {JSON.stringify(log.details)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 grid gap-1 text-[11px] text-white/40">
                        <span>IP: {p.ip_address || "-"}</span>
                        <span className="break-all">Dispositivo: {p.user_agent || "-"}</span>
                        <span>
                          Documento:{" "}
                          {p.document_uploaded_at
                            ? new Date(p.document_uploaded_at).toLocaleString("pt-BR")
                            : "não enviado"}{" "}
                          ({p.document_status || "-"})
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Recusar solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Motivo da recusa (enviado ao usuário)</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex.: documento ilegível, chave PIX de terceiros..."
              className="bg-white/5 border-white/10 text-white"
            />
            <p className="text-[11px] text-white/40">
              O valor será estornado automaticamente para o saldo do usuário.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Voltar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-500"
              disabled={statusMutation.isPending || rejectReason.trim().length < 3}
              onClick={() =>
                selected &&
                statusMutation.mutate({
                  payoutId: selected.id,
                  status: "rejected",
                  rejectionReason: rejectReason.trim(),
                })
              }
            >
              {statusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirmar recusa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Solicitar novo documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="doc-notes">Observação para o usuário (opcional)</Label>
            <Textarea
              id="doc-notes"
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              placeholder="Ex.: envie a CNH aberta, com foto nítida e sem reflexos."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocOpen(false)}>
              Voltar
            </Button>
            <Button
              className="bg-fire hover:bg-fire/90"
              disabled={requestDocMutation.isPending}
              onClick={() =>
                selected &&
                requestDocMutation.mutate({
                  payoutId: selected.id,
                  notes: docNotes.trim() || undefined,
                })
              }
            >
              {requestDocMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Solicitar documento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileUp,
  Loader2,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  cancelMyPayout,
  getPayoutHistory,
  requestPayout,
  resubmitPayoutDocument,
} from "@/lib/payouts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MIN_AMOUNT = 50;

export const PAYOUT_STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
  analyzing: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500", icon: Loader2 },
  approved: { label: "Aprovado", color: "bg-indigo-500/10 text-indigo-500", icon: CheckCircle2 },
  paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
  rejected: { label: "Recusado", color: "bg-red-500/10 text-red-500", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-white/10 text-white/50", icon: XCircle },
};

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ACCEPTED = "image/png,image/jpeg,image/jpg,image/webp,application/pdf";
const MAX_FILE_MB = 8;

interface PayoutRequestPanelProps {
  balance: number;
  userType: "affiliate" | "partner";
  /** Query keys extras a invalidar após cada operação (saldo, listas, etc.). */
  invalidateKeys?: string[];
}

export function PayoutRequestPanel({
  balance,
  userType,
  invalidateKeys = [],
}: PayoutRequestPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const resubmitRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  const requestPayoutFn = useServerFn(requestPayout);
  const cancelPayoutFn = useServerFn(cancelMyPayout);
  const resubmitFn = useServerFn(resubmitPayoutDocument);
  const historyFn = useServerFn(getPayoutHistory);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["my-payout-history", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await historyFn()) as any[],
  });

  const isFirstPayout = useMemo(
    () => !(history || []).some((p) => p.status === "paid"),
    [history],
  );

  const pendingPayout = useMemo(
    () => (history || []).find((p) => p.status === "pending"),
    [history],
  );

  const needsNewDocument = useMemo(
    () =>
      (history || []).filter(
        (p) => p.document_status === "requested" && !["paid", "cancelled"].includes(p.status),
      ),
    [history],
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["my-payout-history"] });
    for (const key of invalidateKeys) queryClient.invalidateQueries({ queryKey: [key] });
  };

  async function uploadDocument(selected: File) {
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      throw new Error(`O arquivo deve ter no máximo ${MAX_FILE_MB}MB.`);
    }
    if (!user?.id) throw new Error("Sessão expirada. Faça login novamente.");

    const ext = selected.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("identity-documents")
      .upload(path, selected, { upsert: false, contentType: selected.type || undefined });

    if (error) throw new Error("Falha no envio do documento: " + error.message);
    return path;
  }

  const requestMutation = useMutation({
    mutationFn: async () => {
      const value = parseFloat(amount.replace(",", "."));
      if (isNaN(value) || value < MIN_AMOUNT) {
        throw new Error(`O valor mínimo para saque é R$ ${brl(MIN_AMOUNT)}.`);
      }
      if (value > balance) throw new Error("O valor solicitado é maior que o seu saldo disponível.");
      if (pixKey.trim().length < 5) throw new Error("Informe uma chave PIX válida.");
      if (isFirstPayout && !file) {
        throw new Error("No primeiro saque é obrigatório anexar um documento de identidade.");
      }

      const document_path = file ? await uploadDocument(file) : undefined;

      return requestPayoutFn({
        data: {
          amount: value,
          method: "pix",
          pix_key: pixKey.trim(),
          user_type: userType,
          ...(document_path ? { document_path } : {}),
        },
      });
    },
    onSuccess: () => {
      toast.success("Solicitação enviada! Você será avisado a cada atualização.");
      setOpen(false);
      setAmount("");
      setFile(null);
      invalidateAll();
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao solicitar saque."),
  });

  const cancelMutation = useMutation({
    mutationFn: async (payoutId: string) => cancelPayoutFn({ data: { payoutId } }),
    onSuccess: () => {
      toast.success("Saque cancelado e valor estornado ao seu saldo.");
      invalidateAll();
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao cancelar saque."),
  });

  const resubmitMutation = useMutation({
    mutationFn: async ({ payoutId, selected }: { payoutId: string; selected: File }) => {
      const document_path = await uploadDocument(selected);
      return resubmitFn({ data: { payoutId, document_path } });
    },
    onSuccess: () => {
      toast.success("Documento reenviado para análise.");
      invalidateAll();
    },
    onError: (error: any) => toast.error(error?.message || "Erro ao reenviar documento."),
  });

  const canRequest = balance >= MIN_AMOUNT && !pendingPayout;

  return (
    <div className="space-y-6">
      <section className="glass p-6 sm:p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
        <div className="mb-5 rounded-full bg-fire/10 w-16 h-16 flex items-center justify-center mx-auto">
          <DollarSign className="w-8 h-8 text-fire" />
        </div>
        <h4 className="font-bold mb-1 text-white">Solicitar Retirada</h4>
        <div className="text-3xl font-display font-black text-emerald-400 my-3">
          R$ {brl(balance)}
        </div>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          Valor mínimo de R$ {brl(MIN_AMOUNT)}. Todo saque passa por{" "}
          <strong className="text-white/70">análise manual</strong> da nossa equipe e é pago via PIX
          em até 4 horas úteis após a aprovação.
        </p>
        <button
          onClick={() => setOpen(true)}
          disabled={!canRequest}
          className="btn-fire w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {pendingPayout
            ? "Você já tem um saque pendente"
            : balance < MIN_AMOUNT
              ? "Saldo insuficiente"
              : "Solicitar Saque"}
        </button>
      </section>

      {needsNewDocument.length > 0 && (
        <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 space-y-3">
          <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold">
            <AlertCircle className="w-4 h-4" /> Documento pendente
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Nossa equipe solicitou um novo documento de identidade para liberar seu saque. Envie uma
            foto legível do RG ou CNH.
          </p>
          <input
            ref={resubmitRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected && resubmittingId) {
                resubmitMutation.mutate({ payoutId: resubmittingId, selected });
              }
              e.target.value = "";
            }}
          />
          {needsNewDocument.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-white/70 font-bold">R$ {brl(Number(p.amount))}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 min-h-[40px]"
                disabled={resubmitMutation.isPending}
                onClick={() => {
                  setResubmittingId(p.id);
                  resubmitRef.current?.click();
                }}
              >
                {resubmitMutation.isPending && resubmittingId === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileUp className="w-4 h-4" />
                )}
                Reenviar documento
              </Button>
            </div>
          ))}
        </div>
      )}

      <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Minhas Solicitações
          </h3>
        </div>

        {historyLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-fire inline" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="p-8 text-center text-xs italic text-muted-foreground">
            Nenhuma solicitação de saque ainda.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {history.map((p) => {
              const status = PAYOUT_STATUS_MAP[p.status] || PAYOUT_STATUS_MAP.pending;
              return (
                <li key={p.id} className="p-4 sm:p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-white">R$ {brl(Number(p.amount))}</div>
                      <div className="text-[10px] text-white/40">
                        {p.created_at ? new Date(p.created_at).toLocaleString("pt-BR") : "-"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color}`}
                    >
                      <status.icon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  {p.status === "rejected" && p.rejection_reason && (
                    <p className="text-[11px] text-red-400/80">Motivo: {p.rejection_reason}</p>
                  )}

                  {p.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 min-h-[40px] px-2"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(p.id)}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Cancelar solicitação
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Saldo disponível</span>
                <span className="text-emerald-400 font-bold">R$ {brl(balance)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Valor mínimo</span>
                <span className="text-white/70 font-bold">R$ {brl(MIN_AMOUNT)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Forma de pagamento</span>
                <span className="text-white/70 font-bold">PIX</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-amount">Valor da retirada (R$)</Label>
              <Input
                id="payout-amount"
                type="number"
                step="0.01"
                min={MIN_AMOUNT}
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-[16px] md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-pix">Chave PIX</Label>
              <Input
                id="payout-pix"
                placeholder="E-mail, CPF, CNPJ, telefone ou aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-[16px] md:text-sm"
              />
            </div>

            {isFirstPayout && (
              <div className="space-y-2">
                <Label>Documento de identidade (obrigatório no 1º saque)</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-left hover:border-fire/40 transition min-h-[56px]"
                >
                  <Upload className="w-4 h-4 text-fire shrink-0" />
                  <span className="text-xs text-white/60 break-all">
                    {file ? file.name : "Enviar RG ou CNH (JPG, PNG ou PDF · até 8MB)"}
                  </span>
                </button>
              </div>
            )}

            <div className="flex gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/60 leading-relaxed">
                Este saque passará por <strong className="text-white/80">análise manual</strong> por
                segurança. Confira sua chave PIX: transferências enviadas para chave incorreta não
                podem ser revertidas.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-fire hover:bg-fire/90 min-h-[44px]"
              disabled={requestMutation.isPending}
              onClick={() => requestMutation.mutate()}
            >
              {requestMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirmar solicitação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

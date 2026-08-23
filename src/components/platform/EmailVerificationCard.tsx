import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Loader2, MailCheck, ShieldAlert } from "lucide-react";
import {
  confirmEmailWithCode,
  getEmailVerificationStatus,
  sendEmailVerificationCode,
} from "@/lib/email-verification.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EmailVerificationCard() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const statusFn = useServerFn(getEmailVerificationStatus);
  const sendFn = useServerFn(sendEmailVerificationCode);
  const confirmFn = useServerFn(confirmEmailWithCode);

  const { data: status, isLoading } = useQuery({
    queryKey: ["email-verification-status"],
    queryFn: async () => (await statusFn()) as any,
  });

  const sendMutation = useMutation({
    mutationFn: async () => sendFn(),
    onSuccess: (res: any) => {
      if (res?.alreadyVerified) {
        queryClient.invalidateQueries({ queryKey: ["email-verification-status"] });
        return;
      }
      setSent(true);
      toast.success("Código enviado", {
        description: `Enviamos um código de 6 dígitos para ${res?.email}. Ele vale por 30 minutos.`,
      });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao enviar o código."),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => confirmFn({ data: { code: code.trim() } }),
    onSuccess: () => {
      toast.success("E-mail confirmado com sucesso!");
      setCode("");
      setSent(false);
      queryClient.invalidateQueries({ queryKey: ["email-verification-status"] });
    },
    onError: (err: any) => toast.error(err?.message || "Código inválido."),
  });

  if (isLoading) {
    return (
      <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <Loader2 className="h-4 w-4 animate-spin text-fire" />
      </section>
    );
  }

  if (status?.verified) {
    return (
      <section className="glass flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
        <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">E-mail confirmado</div>
          <div className="text-[11px] text-white/50 truncate">{status.email}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="glass space-y-4 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
        <div>
          <h4 className="text-sm font-bold text-white">Confirme seu e-mail</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">
            A confirmação é opcional para acessar os cursos, mas obrigatória para afiliados antes do
            primeiro saque.
          </p>
        </div>
      </div>

      {!sent ? (
        <Button
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending}
          className="btn-fire w-full min-h-[44px] font-bold"
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <MailCheck className="h-4 w-4" /> Enviar código de confirmação
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            className="bg-white/5 border-white/10 text-center text-lg tracking-[0.4em] text-white"
          />
          <Button
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending || code.length !== 6}
            className="btn-fire w-full min-h-[44px] font-bold"
          >
            {confirmMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirmar e-mail"
            )}
          </Button>
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="w-full text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white"
          >
            Reenviar código
          </button>
        </div>
      )}
    </section>
  );
}

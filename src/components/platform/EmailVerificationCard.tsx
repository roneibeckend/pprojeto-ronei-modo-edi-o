import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, BadgeCheck, Loader2, MailCheck, ShieldAlert, Timer } from "lucide-react";
import {
  confirmEmailWithCode,
  getEmailVerificationStatus,
  sendEmailVerificationCode,
} from "@/lib/email-verification.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REDIRECT_DELAY_SECONDS = 4;

export function EmailVerificationCard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [justConfirmed, setJustConfirmed] = useState<{ to: string; label: string } | null>(null);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_DELAY_SECONDS);
  const redirectedRef = useRef(false);

  const statusFn = useServerFn(getEmailVerificationStatus);
  const sendFn = useServerFn(sendEmailVerificationCode);
  const confirmFn = useServerFn(confirmEmailWithCode);

  const { data: status, isLoading } = useQuery({
    queryKey: ["email-verification-status"],
    queryFn: async () => (await statusFn()) as any,
  });

  // Sincroniza cooldown/limite vindos do servidor.
  useEffect(() => {
    if (!status?.resend) return;
    setCooldown(status.resend.cooldownSeconds ?? 0);
    setRemaining(status.resend.remainingInWindow ?? null);
    if (status.resend.hasPendingCode) setSent(true);
  }, [status?.resend?.cooldownSeconds, status?.resend?.remainingInWindow, status?.resend?.hasPendingCode]);

  // Contagem regressiva do reenvio.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Redirecionamento automático após confirmar (sem novo login).
  useEffect(() => {
    if (!justConfirmed) return;
    const t = setInterval(() => {
      setRedirectIn((s) => {
        if (s <= 1) {
          clearInterval(t);
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            navigate({ to: justConfirmed.to });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [justConfirmed, navigate]);

  const sendMutation = useMutation({
    mutationFn: async () => sendFn(),
    onSuccess: (res: any) => {
      if (res?.alreadyVerified) {
        queryClient.invalidateQueries({ queryKey: ["email-verification-status"] });
        return;
      }
      setSent(true);
      setCooldown(res?.resend?.cooldownSeconds ?? 60);
      setRemaining(res?.resend?.remainingInWindow ?? null);
      toast.success("Código enviado", {
        description: `Enviamos um código de 6 dígitos para ${res?.email}. Ele vale por 30 minutos.`,
      });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao enviar o código."),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => confirmFn({ data: { code: code.trim() } }),
    onSuccess: (res: any) => {
      toast.success("E-mail confirmado com sucesso!");
      setCode("");
      setSent(false);
      const dest = res?.destination ?? { to: "/app", label: "Área do aluno" };
      setRedirectIn(REDIRECT_DELAY_SECONDS);
      setJustConfirmed(dest);
      queryClient.invalidateQueries({ queryKey: ["email-verification-status"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
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

  if (justConfirmed) {
    return (
      <section className="glass space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white">E-mail confirmado com sucesso</h4>
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              Sua conta já está verificada — não é necessário fazer login novamente. Redirecionando
              para <span className="font-bold text-emerald-300">{justConfirmed.label}</span> em{" "}
              {redirectIn}s.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            redirectedRef.current = true;
            navigate({ to: justConfirmed.to });
          }}
          className="btn-fire w-full min-h-[44px] font-bold"
        >
          Ir agora para {justConfirmed.label} <ArrowRight className="h-4 w-4" />
        </Button>
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

  const limitReached = remaining !== null && remaining <= 0;
  const resendDisabled = sendMutation.isPending || cooldown > 0 || limitReached;

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
          disabled={resendDisabled}
          className="btn-fire w-full min-h-[44px] font-bold"
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : cooldown > 0 ? (
            <>
              <Timer className="h-4 w-4" /> Aguarde {cooldown}s
            </>
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
            disabled={resendDisabled}
            className="w-full min-h-[40px] text-[11px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white disabled:cursor-not-allowed disabled:text-white/25"
          >
            {cooldown > 0
              ? `Reenviar em ${cooldown}s`
              : limitReached
                ? "Limite de reenvios atingido"
                : "Reenviar código"}
          </button>
        </div>
      )}

      <p className="text-center text-[10px] text-white/35">
        {limitReached
          ? "Você atingiu o limite de códigos por hora. Tente novamente mais tarde."
          : remaining !== null
            ? `${remaining} de ${status?.resend?.maxPerWindow ?? 5} reenvios disponíveis nesta hora.`
            : "Máximo de 5 códigos por hora."}
      </p>
    </section>
  );
}

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TicketPercent, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCouponCheckout, validateCouponPublic } from "@/lib/coupons.functions";
import { formatPrice } from "@/lib/format";

export interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
}

interface CouponInputProps {
  productId?: string;
  productType?: "course" | "ebook";
  amount?: number;
  context?: "main" | "upsell" | "downsell" | "order_bump";
  /** Quando true, usa a validação autenticada (com limite por usuário). */
  authenticated: boolean;
  applied: AppliedCoupon | null;
  onApplied: (coupon: AppliedCoupon | null) => void;
  /** Código inicial (ex.: vindo do localStorage da landing page). */
  initialCode?: string;
}

export function CouponInput({
  productId,
  productType,
  amount,
  context = "main",
  authenticated,
  applied,
  onApplied,
  initialCode,
}: CouponInputProps) {
  const [expanded, setExpanded] = useState(Boolean(initialCode));
  const [code, setCode] = useState(initialCode ?? "");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validateAuthed = useServerFn(validateCouponCheckout);
  const validatePublic = useServerFn(validateCouponPublic);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 3) {
      setError("Digite o código do cupom.");
      return;
    }
    setIsValidating(true);
    setError(null);
    try {
      const fn = authenticated ? validateAuthed : validatePublic;
      const result: any = await fn({
        data: {
          code: trimmed,
          productId,
          productType,
          amount,
          context,
        },
      });

      if (!result?.valid) {
        setError(result?.message || "Cupom inválido.");
        onApplied(null);
        return;
      }

      onApplied({
        code: String(result.code ?? trimmed.toUpperCase()),
        discountType: result.discount_type,
        discountValue: Number(result.discount_value) || 0,
        discountAmount: Number(result.discount_amount) || 0,
        finalAmount: result.final_amount != null ? Number(result.final_amount) : (amount ?? 0),
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Não foi possível validar o cupom.");
      onApplied(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onApplied(null);
    setCode("");
    setError(null);
  };

  if (applied) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider truncate">
              Cupom {applied.code} aplicado
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-emerald-400/60 hover:text-emerald-300 transition-colors shrink-0"
            aria-label="Remover cupom"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[11px] text-emerald-200/80 pl-6">
          {applied.discountType === "percentage"
            ? `${applied.discountValue}% de desconto`
            : `${formatPrice(applied.discountValue)} de desconto`}
          {amount != null && applied.discountAmount > 0 && (
            <> — você economiza {formatPrice(applied.discountAmount)}</>
          )}
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors"
      >
        <TicketPercent className="h-3.5 w-3.5" />
        Tem um cupom de desconto?
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO DO CUPOM"
          maxLength={40}
          className="h-10 text-xs font-bold uppercase tracking-widest"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={isValidating || code.trim().length < 3}
          className="h-10 px-4 text-xs font-bold uppercase tracking-wider shrink-0"
        >
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && (
        <p className="flex items-start gap-1.5 text-[11px] text-red-400">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

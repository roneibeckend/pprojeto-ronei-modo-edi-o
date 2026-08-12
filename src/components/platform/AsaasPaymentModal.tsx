import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink, CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { usePaymentModal } from "@/hooks/use-payment-modal";
import { useEnrollments } from "@/hooks/use-enrollments";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { verifyAsaasPayment } from "@/lib/asaas.functions";
import { toast } from "sonner";

export function AsaasPaymentModal() {
  const { isOpen, paymentUrl, title, productId, productType, status, closePayment, setStatus } = usePaymentModal();
  const { isEnrolledInCourse, isEnrolledInEbook, refetchEnrollments } = useEnrollments();
  const [opened, setOpened] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOpen) setOpened(false);
  }, [isOpen, paymentUrl]);

  // Polling: revalida as matrículas e confirma automaticamente após o webhook
  React.useEffect(() => {
    if (!isOpen || !productId || !productType || status === 'confirmed') return;

    const check = async () => {
      await refetchEnrollments();
      const isEnrolled = productType === 'course'
        ? isEnrolledInCourse(productId)
        : isEnrolledInEbook(productId);
      if (isEnrolled) setStatus('confirmed');
    };

    const interval = window.setInterval(check, 4000);
    return () => clearInterval(interval);
  }, [isOpen, productId, productType, status, isEnrolledInCourse, isEnrolledInEbook, setStatus, refetchEnrollments]);

  // Redirecionamento automático após confirmação
  React.useEffect(() => {
    if (status === 'confirmed' && productId && productType) {
      const timer = setTimeout(() => {
        closePayment();
        navigate({ to: productType === 'course' ? `/app/cursos/${productId}` : `/app/ebooks/${productId}` });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, productId, productType, navigate, closePayment]);

  const handleOpenCheckout = () => {
    if (!paymentUrl) return;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    setOpened(true);
  };

  // Verificação manual: consulta o Asaas diretamente (caso o webhook falhe)
  const handleVerifyNow = async () => {
    if (!productId || !productType) return;
    setChecking(true);
    try {
      const result = await verifyAsaasPayment({ data: { productId, productType } });
      await refetchEnrollments();
      if (result.confirmed) {
        setStatus('confirmed');
        toast.success("Pagamento confirmado! Acesso liberado.");
      } else {
        toast.info(result.message || "Ainda não localizamos a confirmação do pagamento.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível verificar o pagamento agora.");
    } finally {
      setChecking(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePayment()}>
      <DialogContent className="max-w-lg w-[95vw] glass border-white/10">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 pr-6">
            <ShoppingBag className="h-5 w-5 text-fire shrink-0" />
            {status === 'confirmed' ? 'Pagamento confirmado' : title}
          </DialogTitle>
          <DialogDescription>
            {status === 'confirmed'
              ? 'Seu acesso já está liberado.'
              : 'Finalize o pagamento na página segura do Asaas. Esta janela acompanha a confirmação automaticamente.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === 'confirmed' ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="mb-6 rounded-full bg-green-500/10 p-6 text-green-500">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <h2 className="text-2xl font-black mb-2">Sucesso!</h2>
              <p className="text-muted-foreground max-w-sm">
                Seu pagamento foi confirmado e o acesso ao conteúdo já está liberado.
              </p>
              <div className="mt-6 flex items-center gap-2 text-fire font-medium">
                Redirecionando você agora <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 py-2">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <p className="text-sm text-muted-foreground">
                  Pix, cartão ou boleto no ambiente oficial do Asaas. Não feche esta janela: o acesso é liberado aqui
                  automaticamente após a confirmação.
                </p>
              </div>

              <button
                onClick={handleOpenCheckout}
                disabled={!paymentUrl}
                className="btn-fire w-full font-bold disabled:opacity-50"
              >
                {opened ? 'Reabrir pagamento' : 'Ir para o pagamento seguro'}
                <ExternalLink className="h-4 w-4" />
              </button>

              {opened && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-fire" />
                  Aguardando confirmação do pagamento
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

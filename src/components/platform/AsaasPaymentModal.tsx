import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { usePaymentModal } from "@/hooks/use-payment-modal";
import { useEnrollments } from "@/hooks/use-enrollments";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function AsaasPaymentModal() {
  const { isOpen, paymentUrl, title, productId, productType, status, closePayment, setStatus } = usePaymentModal();
  const { isEnrolledInCourse, isEnrolledInEbook } = useEnrollments();
  const [iframeLoading, setIframeLoading] = React.useState(true);
  const [iframeError, setIframeError] = React.useState(false);
  const navigate = useNavigate();

  // Polling para verificar se o pagamento foi liberado
  React.useEffect(() => {
    let interval: number | undefined;

    if (isOpen && productId && productType && status !== 'confirmed') {
      const handleMessage = (event: MessageEvent) => {
        console.log('[PaymentModal] Message received:', event.data);
      };

      window.addEventListener('message', handleMessage);
      
      interval = window.setInterval(() => {
        const isEnrolled = productType === 'course' 
          ? isEnrolledInCourse(productId) 
          : isEnrolledInEbook(productId);

        if (isEnrolled) {
          setStatus('confirmed');
          if (interval) clearInterval(interval);
        }
      }, 3000);

      return () => {
        window.removeEventListener('message', handleMessage);
        if (interval) clearInterval(interval);
      };
    }
  }, [isOpen, productId, productType, status, isEnrolledInCourse, isEnrolledInEbook, setStatus]);

  // Redirecionamento automático após confirmação
  React.useEffect(() => {
    if (status === 'confirmed' && productId && productType) {
      const timer = setTimeout(() => {
        closePayment();
        if (productType === 'course') {
          navigate({ to: `/app/cursos/${productId}` });
        } else {
          navigate({ to: `/app/ebooks/${productId}` });
        }
      }, 3000); // 3 segundos de feedback visual antes de redirecionar

      return () => clearTimeout(timer);
    }
  }, [status, productId, productType, navigate, closePayment]);

  React.useEffect(() => {
    if (isOpen) {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [isOpen, paymentUrl]);

  const handleRetry = () => {
    setStatus('idle');
    setIframeLoading(true);
    setIframeError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePayment()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden glass border-white/10 flex flex-col">
        <DialogHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-fire" />
            {status === 'confirmed' ? 'Pagamento Confirmado' : `Checkout: ${title}`}
          </DialogTitle>
          {status !== 'confirmed' && (
            <a 
              href={paymentUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mr-8 text-xs text-muted-foreground hover:text-fire flex items-center gap-1 transition-colors"
            >
              Abrir em nova aba <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </DialogHeader>
        
        <div className="flex-1 bg-white relative overflow-hidden">
          <AnimatePresence mode="wait">
            {status === 'confirmed' ? (
              <motion.div 
                key="confirmed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background z-50 p-6 text-center"
              >
                <div className="mb-6 rounded-full bg-green-500/10 p-6 text-green-500">
                  <CheckCircle2 className="h-20 w-20" />
                </div>
                <h2 className="text-3xl font-black mb-2">Sucesso!</h2>
                <p className="text-muted-foreground max-w-md text-lg">
                  Seu pagamento foi confirmado e o acesso ao conteúdo já está liberado.
                </p>
                <div className="mt-8 flex items-center gap-2 text-fire font-medium animate-pulse">
                  Redirecionando você agora <ArrowRight className="h-4 w-4" />
                </div>
              </motion.div>
            ) : status === 'failed' ? (
              <motion.div 
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background z-50 p-6 text-center"
              >
                <div className="mb-6 rounded-full bg-red-500/10 p-6 text-red-500">
                  <AlertCircle className="h-16 w-16" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Não conseguimos processar seu pagamento. Por favor, tente novamente ou escolha outro método no checkout.
                </p>
                <button 
                  onClick={handleRetry}
                  className="btn-fire px-8 py-3 font-bold"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            ) : (
              <motion.div key="iframe" className="w-full h-full relative">
                {iframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10">
                    <Loader2 className="h-10 w-10 animate-spin text-fire mb-4" />
                    <p className="text-lg font-bold">Iniciando checkout seguro...</p>
                    <p className="text-sm text-muted-foreground mt-2">Aguarde um instante enquanto conectamos com o Asaas</p>
                  </div>
                )}
                
                {iframeError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20 p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Erro de Carregamento</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Não foi possível exibir o checkout de forma integrada. Isso pode ocorrer por restrições de segurança do seu navegador ou rede.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={handleRetry} className="btn-ghost-fire text-xs">Tentar Novamente</button>
                      <a 
                        href={paymentUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-fire text-xs flex items-center gap-2"
                        onClick={() => closePayment()}
                      >
                        Pagar em Nova Aba <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {paymentUrl && !iframeError && (
                  <iframe
                    src={paymentUrl}
                    className="w-full h-full border-none"
                    onLoad={() => {
                      setIframeLoading(false);
                      setIframeError(false);
                    }}
                    onError={() => {
                      setIframeLoading(false);
                      setIframeError(true);
                    }}
                    title="Asaas Checkout"
                    allow="payment"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
                
                {/* Overlay de processamento discreto quando estamos pollando */}
                {!iframeLoading && status === 'idle' && (
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      Aguardando confirmação...
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

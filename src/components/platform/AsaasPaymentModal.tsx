
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink } from "lucide-react";
import { create } from 'zustand';

interface PaymentState {
  isOpen: boolean;
  paymentUrl: string | null;
  title: string;
  onClose: (() => void) | null;
  openPayment: (url: string, title: string, onClose?: () => void) => void;
  closePayment: () => void;
}

export const usePaymentModal = create<PaymentState>((set) => ({
  isOpen: false,
  paymentUrl: null,
  title: '',
  onClose: null,
  openPayment: (url, title, onClose) => set({ isOpen: true, paymentUrl: url, title, onClose: onClose || null }),
  closePayment: () => set((state) => {
    if (state.onClose) state.onClose();
    return { isOpen: false, paymentUrl: null, title: '', onClose: null };
  }),
}));

export function AsaasPaymentModal() {
  const { isOpen, paymentUrl, title, closePayment } = usePaymentModal();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen, paymentUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePayment()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden glass border-white/10 flex flex-col">
        <DialogHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Pagamento: {title}
          </DialogTitle>
          <a 
            href={paymentUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mr-8 text-xs text-muted-foreground hover:text-fire flex items-center gap-1 transition-colors"
          >
            Abrir em nova aba <ExternalLink className="h-3 w-3" />
          </a>
        </DialogHeader>
        
        <div className="flex-1 bg-white relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-fire mb-2" />
              <p className="text-sm font-medium">Carregando checkout seguro...</p>
            </div>
          )}
          {paymentUrl && (
            <iframe
              src={paymentUrl}
              className="w-full h-full border-none"
              onLoad={() => setIsLoading(false)}
              title="Asaas Checkout"
              allow="payment"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

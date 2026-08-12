import { create } from 'zustand';

interface PostPurchaseOfferState {
  isEnabled: boolean;
  togglePostPurchaseOfferPopup: (enabled: boolean) => void;
}

export const usePostPurchaseOfferStore = create<PostPurchaseOfferState>((set) => ({
  isEnabled: true, // Habilitado por padrão
  togglePostPurchaseOfferPopup: (enabled) => set({ isEnabled: enabled }),
}));

// Expor para window para permitir controle global via console se necessário
if (typeof window !== 'undefined') {
  (window as any).togglePostPurchaseOfferPopup = (enabled: boolean) => {
    usePostPurchaseOfferStore.getState().togglePostPurchaseOfferPopup(enabled);
  };
}

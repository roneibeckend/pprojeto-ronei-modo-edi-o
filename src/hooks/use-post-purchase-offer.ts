import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface PostPurchaseOfferState {
  isEnabled: boolean;
  togglePostPurchaseOfferPopup: (enabled: boolean) => void;
  syncWithDatabase: () => Promise<void>;
}

export const usePostPurchaseOfferStore = create<PostPurchaseOfferState>((set) => ({
  isEnabled: true, 
  togglePostPurchaseOfferPopup: (enabled: boolean) => set({ isEnabled: enabled }),
  syncWithDatabase: async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('status')
        .eq('category', 'offer_settings')
        .maybeSingle();
      
      if (!error && data) {
        set({ isEnabled: data.status ?? true });
      }
    } catch (err) {
      console.error('Failed to sync offer settings:', err);
    }
  }
}));

if (typeof window !== 'undefined') {
  (window as any).togglePostPurchaseOfferPopup = (enabled: boolean) => {
    usePostPurchaseOfferStore.getState().togglePostPurchaseOfferPopup(enabled);
  };
}

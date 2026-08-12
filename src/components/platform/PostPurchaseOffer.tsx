import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnrollments } from '@/hooks/use-enrollments';
import { toast } from 'sonner';
import { IMG } from '@/lib/platform-data';

interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  type: 'course' | 'ebook';
  cover_url?: string | null;
}

interface PostPurchaseOfferProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithOffers: (selectedOffers: OfferItem[]) => void;
  onProceedWithoutOffers: () => void;
  originalProductId: string;
}

export function PostPurchaseOffer({
  isOpen,
  onClose,
  onProceedWithOffers,
  onProceedWithoutOffers,
  originalProductId
}: PostPurchaseOfferProps) {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isEnrolledInCourse, isEnrolledInEbook } = useEnrollments();

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
    }
  }, [isOpen, originalProductId]);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, ebooksRes] = await Promise.all([
        supabase.from('courses').select('*').eq('is_locked', false).neq('id', originalProductId),
        supabase.from('ebooks').select('*').eq('is_locked', false).neq('id', originalProductId)
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (ebooksRes.error) throw ebooksRes.error;

      const allPossibleOffers: OfferItem[] = [
        ...(coursesRes.data || []).map(c => ({ ...c, type: 'course' as const })),
        ...(ebooksRes.data || []).map(e => ({ ...e, type: 'ebook' as const })),
      ].filter(item => {
        // Filtrar apenas o que o usuário NÃO adquiriu
        if (item.type === 'course') {
          return !isEnrolledInCourse(item.id);
        } else {
          return !isEnrolledInEbook(item.id);
        }
      });

      // Priorizar ou embaralhar para pegar 2-3 itens
      // Aqui apenas pegamos os 3 primeiros para simplicidade, mas poderíamos ordenar por vendas/data
      const selectedOffers = allPossibleOffers
        .sort(() => 0.5 - Math.random()) // Embaralhar simples
        .slice(0, 3);

      setOffers(selectedOffers);
      // Por padrão, não selecionamos nada ou poderíamos selecionar todos
    } catch (error) {
      console.error('Erro ao buscar ofertas:', error);
      toast.error('Erro ao carregar ofertas complementares.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddAndProceed = () => {
    const selectedItems = offers.filter(o => selectedIds.includes(o.id));
    onProceedWithOffers(selectedItems);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onProceedWithoutOffers()}>
      <DialogContent className="max-w-2xl glass border-white/10 p-0 overflow-hidden sm:rounded-3xl">
        <div className="relative p-6 sm:p-8">
          <button 
            onClick={onProceedWithoutOffers}
            className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 text-gold mb-2">
              <Sparkles className="h-5 w-5 fill-current" />
              <span className="text-xs font-bold uppercase tracking-widest">Oferta Exclusiva</span>
            </div>
            <DialogTitle className="font-display text-2xl sm:text-3xl font-black text-white">
              Turbine seu aprendizado!
            </DialogTitle>
            <p className="text-muted-foreground mt-2">
              Adicione estes itens complementares agora e ganhe <span className="text-gold font-bold">15% de desconto</span> em cada um.
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-10">
              <p>Nenhuma oferta adicional disponível no momento.</p>
              <Button onClick={onProceedWithoutOffers} className="mt-4 btn-fire">
                Prosseguir para o Checkout
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {offers.map(offer => {
                const discountPrice = (offer.price || 0) * 0.85;
                const isSelected = selectedIds.includes(offer.id);
                
                return (
                  <div 
                    key={offer.id}
                    onClick={() => toggleSelection(offer.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-gold/10 border-gold shadow-lg shadow-gold/5' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="h-16 w-24 sm:h-20 sm:w-32 rounded-lg overflow-hidden shrink-0 bg-muted/20">
                      <img 
                        src={offer.cover_url || IMG.hero} 
                        alt={offer.title} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                          {offer.type === 'course' ? 'Curso' : 'E-book'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base truncate text-white">{offer.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs line-through text-muted-foreground">
                          R$ {offer.price?.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm font-bold text-gold">
                          R$ {discountPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-gold border-gold text-black' : 'border-white/20'
                    }`}>
                      {isSelected && <ShoppingCart className="h-3 w-3 fill-current" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={onProceedWithoutOffers}
              className="w-full rounded-xl border-white/10 hover:bg-white/5 h-12"
            >
              Prosseguir sem Ofertas
            </Button>
            <Button 
              disabled={selectedIds.length === 0}
              onClick={handleAddAndProceed}
              className="w-full btn-fire rounded-xl font-bold h-12 shadow-lg shadow-fire/20"
            >
              Adicionar Ofertas e Prosseguir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

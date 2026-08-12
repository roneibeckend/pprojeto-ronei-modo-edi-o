import { useState } from "react";
import { Star, Send, Loader2, X, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackModalProps {
  courseId?: string;
  ebookId?: string;
  itemTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ courseId, ebookId, itemTitle, isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    // Client-side anti-spam: check last submission time
    const lastSubmission = localStorage.getItem(`last_feedback_${courseId || ebookId}`);
    if (lastSubmission) {
      const lastTime = parseInt(lastSubmission, 10);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      if (now - lastTime < oneHour) {
        toast.error("Você já enviou um feedback recentemente. Tente novamente mais tarde.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const feedbackData: any = {
        user_id: user.id,
        rating,
        comment,
        status: 'pending'
      };

      if (courseId) {
        feedbackData.course_id = courseId;
      } else if (ebookId) {
        feedbackData.ebook_id = ebookId;
      }

      const { error } = await supabase
        .from("course_feedback")
        .upsert(feedbackData, {
          onConflict: courseId ? 'user_id,course_id' : 'user_id,ebook_id'
        });

      if (error) throw error;

      localStorage.setItem(`last_feedback_${courseId || ebookId}`, Date.now().toString());
      setIsSubmitted(true);
      toast.success("Feedback enviado com sucesso! Ele passará por moderação.");
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao enviar feedback:", error);
      toast.error(error.message || "Erro ao enviar feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="bg-[#0e0e0e] border-white/10 text-white max-w-md w-[90%] rounded-2xl p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6a00]/10 text-[#ff6a00]">
                    <Star className="h-6 w-6 fill-current" />
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <DialogTitle className="text-2xl font-black font-display text-white">
                  O que você achou do curso?
                </DialogTitle>
                <p className="text-sm text-white/40">
                  Parabéns por concluir <span className="text-white font-bold">{itemTitle}</span>! Sua opinião nos ajuda a melhorar.
                </p>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          (hoverRating || rating) >= star
                            ? "fill-[#ff6a00] text-[#ff6a00]"
                            : "text-white/10"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00]">
                  {rating === 1 && "Péssimo"}
                  {rating === 2 && "Ruim"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bom"}
                  {rating === 5 && "Excelente!"}
                  {rating === 0 && "Selecione uma nota"}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Seu comentário (opcional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos o que você mais gostou ou o que podemos melhorar..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm min-h-[120px] focus:border-[#ff6a00] outline-none transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full btn-fire py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? "Enviando..." : "Enviar Feedback"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-4 py-10"
            >
              <div className="rounded-full bg-green-500/10 p-4 text-green-500">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-black font-display text-white">Obrigado!</h3>
              <p className="text-sm text-white/40 max-w-[200px]">
                Seu feedback foi recebido e em breve estará disponível na vitrine.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

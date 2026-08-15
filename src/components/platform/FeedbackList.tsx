import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedbackListProps {
  courseId?: string;
  ebookId?: string;
}

export function FeedbackList({ courseId, ebookId }: FeedbackListProps) {
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["feedbacks", courseId, ebookId],
    queryFn: async () => {
      let query = supabase
        .from("course_feedback")
        .select(`
          id,
          rating,
          comment,
          created_at,
          admin_reply,
          profile:profiles(name, avatar_url)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (courseId) {
        query = query.eq("course_id", courseId);
      } else if (ebookId) {
        query = query.eq("ebook_id", ebookId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 w-full bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg font-bold uppercase tracking-widest text-white/90">
          O que os alunos estão dizendo
        </h3>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <div 
            key={feedback.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition"
          >
            <div className="flex flex-col gap-4">
              {/* Header: User & Rating */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10">
                    {feedback.profile?.avatar_url ? (
                      <img src={feedback.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center">
                        <User className="h-5 w-5 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">
                      {feedback.profile?.name || "Aluno"}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-3 w-3 ${feedback.rating >= star ? 'fill-gold text-gold' : 'text-white/10'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <p className="text-sm text-white/70 italic leading-relaxed">
                "{feedback.comment || "Sem comentários."}"
              </p>

              {/* Admin Reply */}
              {feedback.admin_reply && (
                <div className="mt-2 p-4 rounded-xl bg-gold/5 border border-gold/10 ml-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3 w-3 text-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Resposta do Professor</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed italic">
                    "{feedback.admin_reply}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

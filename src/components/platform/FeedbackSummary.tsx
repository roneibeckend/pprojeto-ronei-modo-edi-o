import { useState } from "react";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackSummaryProps {
  courseId?: string;
  ebookId?: string;
}

export function FeedbackSummary({ courseId, ebookId }: FeedbackSummaryProps) {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["feedback-summary", courseId, ebookId],
    queryFn: async () => {
      let query = supabase
        .from("course_feedback")
        .select("rating")
        .eq("status", "approved");

      if (courseId) {
        query = query.eq("course_id", courseId);
      } else if (ebookId) {
        query = query.eq("ebook_id", ebookId);
      } else {
        return { average: 0, count: 0 };
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return { average: 0, count: 0 };

      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      return {
        average: Number((sum / data.length).toFixed(1)),
        count: data.length
      };
    }
  });

  if (isLoading || !summary || summary.count === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-fit">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              summary.average >= star
                ? "fill-[#ff6a00] text-[#ff6a00]"
                : "text-white/20"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white">{summary.average}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          ({summary.count} {summary.count === 1 ? 'Avaliação' : 'Avaliações'})
        </span>
      </div>
    </div>
  );
}

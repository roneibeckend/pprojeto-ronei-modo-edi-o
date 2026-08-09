import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export function useProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Cursos ---

  const { data: lessonProgress, isLoading: isLoadingLessonProgress } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const toggleLessonMutation = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string, completed: boolean }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: completed,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", user?.id] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar progresso: " + error.message);
    }
  });

  // --- E-books ---

  const { data: ebookProgress, isLoading: isLoadingEbookProgress } = useQuery({
    queryKey: ["ebook-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("ebook_progress")
        .select("chapter_id, completed_at")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const completeChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("ebook_progress")
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          completed_at: new Date().toISOString(),
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebook-progress", user?.id] });
    },
    onError: (error: any) => {
      console.error("Erro ao registrar leitura:", error);
    }
  });

  return {
    // Cursos
    lessonProgress: lessonProgress || [],
    isLessonCompleted: (lessonId: string) => lessonProgress?.some(p => p.lesson_id === lessonId && p.is_completed) || false,
    toggleLessonProgress: toggleLessonMutation.mutateAsync,
    isTogglingLesson: toggleLessonMutation.isPending,

    // E-books
    ebookProgress: ebookProgress || [],
    isChapterCompleted: (chapterId: string) => ebookProgress?.some(p => p.chapter_id === chapterId && !!p.completed_at) || false,
    completeChapter: completeChapterMutation.mutate,

    isLoading: isLoadingLessonProgress || isLoadingEbookProgress
  };
}

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
    mutationFn: async ({ lessonId, completed, moduleId, courseId }: { lessonId: string, completed: boolean, moduleId?: string, courseId?: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Register point tracking if just started or completed
      if (moduleId && courseId) {
        // Track start if not already tracked
        await supabase
          .from("progress_tracking")
          .upsert({
            user_id: user.id,
            item_type: 'module',
            item_id: moduleId,
            started_at: new Date().toISOString()
          }, { onConflict: 'user_id,item_type,item_id' });
        
        await supabase
          .from("progress_tracking")
          .upsert({
            user_id: user.id,
            item_type: 'course',
            item_id: courseId,
            started_at: new Date().toISOString()
          }, { onConflict: 'user_id,item_type,item_id' });
      }

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

      // Logic to check module/course completion and update progress_tracking
      if (completed && moduleId && courseId) {
        // We'll call a server function or handle it in a trigger eventually, 
        // but for now let's handle the completion update here if all lessons are done
        const { data: lessons } = await supabase
          .from("course_lessons")
          .select("id")
          .eq("module_id", moduleId);
        
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .in("lesson_id", lessons?.map(l => l.id) || []);
        
        if (progress?.length === lessons?.length) {
          // Module completed
          await supabase
            .from("progress_tracking")
            .update({ completed_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("item_type", 'module')
            .eq("item_id", moduleId)
            .is("completed_at", null);
        }

        // Similar for course...
        const { data: allLessons } = await supabase
          .from("course_lessons")
          .select("id, module_id")
          .filter("module_id", "in", `(select id from course_modules where course_id = '${courseId}')`);
        
        // Note: The above filter is complex for PostgREST without a specific view, 
        // usually we'd do this via a RPC for cleaner logic. 
        // Let's assume the DB trigger handle_item_completion will do the heavy lifting 
        // once we mark it as completed.
      }
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
    mutationFn: async ({ chapterId, ebookId, moduleId }: { chapterId: string, ebookId?: string, moduleId?: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Track start if not already tracked
      if (ebookId && moduleId) {
        await supabase
          .from("progress_tracking")
          .upsert({
            user_id: user.id,
            item_type: 'ebook_module',
            item_id: moduleId,
            started_at: new Date().toISOString()
          }, { onConflict: 'user_id,item_type,item_id' });
        
        await supabase
          .from("progress_tracking")
          .upsert({
            user_id: user.id,
            item_type: 'ebook',
            item_id: ebookId,
            started_at: new Date().toISOString()
          }, { onConflict: 'user_id,item_type,item_id' });
      }

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

      // Logic to check module completion
      if (ebookId && moduleId) {
        const { data: chapters } = await supabase
          .from("ebook_chapters")
          .select("id")
          .eq("module_id", moduleId);
        
        const { data: progress } = await supabase
          .from("ebook_progress")
          .select("chapter_id")
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .in("chapter_id", chapters?.map(c => c.id) || []);
        
        if (progress?.length === chapters?.length) {
          await supabase
            .from("progress_tracking")
            .update({ completed_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("item_type", 'ebook_module')
            .eq("item_id", moduleId)
            .is("completed_at", null);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebook-progress", user?.id] });
    },
    onError: (error: any) => {
      console.error("Erro ao registrar leitura:", error);
    }
  });

  const { data: globalProgressTracking, isLoading: isLoadingGlobalProgress } = useQuery({
    queryKey: ["global-progress-tracking", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("progress_tracking")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const startedCount = globalProgressTracking?.filter(t => 
    (t.item_type === 'course' || t.item_type === 'ebook') && !!t.started_at
  ).length || 0;

  const finishedCount = globalProgressTracking?.filter(t => 
    (t.item_type === 'course' || t.item_type === 'ebook') && !!t.completed_at
  ).length || 0;

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

    // Global
    startedCount,
    finishedCount,
    isLoading: isLoadingLessonProgress || isLoadingEbookProgress || isLoadingGlobalProgress
  };
}

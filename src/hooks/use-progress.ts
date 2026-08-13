import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export function useProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lessonProgress, isLoading: isLoadingLessonProgress } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("lesson_progress").select("lesson_id, is_completed").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: ebookProgress, isLoading: isLoadingEbookProgress } = useQuery({
    queryKey: ["ebook-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("ebook_progress").select("chapter_id, completed_at").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: globalProgressTracking, isLoading: isLoadingGlobalProgress } = useQuery({
    queryKey: ["global-progress-tracking", user?.id],
    queryFn: async () => {
      if (!user?.id) return { lessonCount: 0, chapterCount: 0, tracking: [] };
      const [
        { data: allLessons },
        { data: allChapters },
        { data: progressTracking }
      ] = await Promise.all([
        supabase.from("course_lessons").select("id"),
        supabase.from("ebook_chapters").select("id"),
        supabase.from("progress_tracking").select("item_type, started_at, completed_at").eq("user_id", user.id)
      ]);

      return {
        lessonCount: allLessons?.length || 0,
        chapterCount: allChapters?.length || 0,
        tracking: progressTracking || []
      };
    },
    enabled: !!user?.id,
  });

  const toggleLessonMutation = useMutation({
    mutationFn: async ({ lessonId, completed, moduleId, courseId }: { lessonId: string, completed: boolean, moduleId?: string, courseId?: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (moduleId && courseId) {
        await supabase.from("progress_tracking").upsert({ user_id: user.id, item_type: 'module', item_id: moduleId, started_at: new Date().toISOString() }, { onConflict: 'user_id,item_type,item_id' });
        await supabase.from("progress_tracking").upsert({ user_id: user.id, item_type: 'course', item_id: courseId, started_at: new Date().toISOString() }, { onConflict: 'user_id,item_type,item_id' });
      }
      await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId, is_completed: completed, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lesson-progress", user?.id] }),
  });

  const completeChapterMutation = useMutation({
    mutationFn: async ({ chapterId, ebookId, moduleId }: { chapterId: string, ebookId?: string, moduleId?: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (ebookId && moduleId) {
        await supabase.from("progress_tracking").upsert({ user_id: user.id, item_type: 'ebook_module', item_id: moduleId, started_at: new Date().toISOString() }, { onConflict: 'user_id,item_type,item_id' });
        await supabase.from("progress_tracking").upsert({ user_id: user.id, item_type: 'ebook', item_id: ebookId, started_at: new Date().toISOString() }, { onConflict: 'user_id,item_type,item_id' });
      }
      await supabase.from("ebook_progress").upsert({ user_id: user.id, chapter_id: chapterId, completed_at: new Date().toISOString(), last_read_at: new Date().toISOString() }, { onConflict: 'user_id,chapter_id' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ebook-progress", user?.id] }),
  });

  const totalLessons = globalProgressTracking?.lessonCount || 0;
  const totalChapters = globalProgressTracking?.chapterCount || 0;
  const completedLessons = lessonProgress?.filter(p => p.is_completed).length || 0;
  const completedChapters = ebookProgress?.filter(p => !!p.completed_at).length || 0;
  const totalCompleted = completedLessons + completedChapters;
  const totalItems = totalLessons + totalChapters;
  const totalProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  const startedCount = globalProgressTracking?.tracking.filter((t: any) => 
    (t.item_type === 'course' || t.item_type === 'ebook') && !!t.started_at
  ).length || 0;

  const finishedCount = globalProgressTracking?.tracking.filter((t: any) => 
    (t.item_type === 'course' || t.item_type === 'ebook') && !!t.completed_at
  ).length || 0;

  return {
    lessonProgress: lessonProgress || [],
    isLessonCompleted: (id: string) => lessonProgress?.some(p => p.lesson_id === id && p.is_completed) || false,
    toggleLessonProgress: toggleLessonMutation.mutateAsync,
    isTogglingLesson: toggleLessonMutation.isPending,
    ebookProgress: ebookProgress || [],
    isChapterCompleted: (id: string) => ebookProgress?.some(p => p.chapter_id === id && !!p.completed_at) || false,
    completeChapter: completeChapterMutation.mutate,
    totalProgress,
    startedCount,
    finishedCount,
    isLoading: isLoadingLessonProgress || isLoadingEbookProgress || isLoadingGlobalProgress
  };
}

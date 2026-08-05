import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });
};

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          modules (
            *,
            lessons (*)
          )
        `)
        .order('order_index', { foreignTable: 'modules' })
        .order('order_index', { foreignTable: 'modules.lessons' });
        
      if (error) throw error;
      return data;
    },
  });
};

export const useEbooks = () => {
  return useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });
};

export const useRecipes = () => {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });
};

export const useLessonProgress = (courseId?: string) => {
  return useQuery({
    queryKey: ["lesson_progress", courseId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id);
        
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });
};

export const useMarkLessonComplete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: completed,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,lesson_id"
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson_progress"] });
    },
  });
};
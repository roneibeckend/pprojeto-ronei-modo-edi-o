import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useEnrollments() {
  const { user } = useAuth();

  const { data: courseEnrollments, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["course-enrollments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map((e) => e.course_id);
    },
    enabled: !!user?.id,
  });

  const { data: ebookEnrollments, isLoading: isLoadingEbooks } = useQuery({
    queryKey: ["ebook-enrollments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("ebook_enrollments")
        .select("ebook_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map((e) => e.ebook_id);
    },
    enabled: !!user?.id,
  });

  return {
    courseEnrollments: courseEnrollments || [],
    ebookEnrollments: ebookEnrollments || [],
    isLoading: isLoadingCourses || isLoadingEbooks,
    isEnrolledInCourse: (id: string) => courseEnrollments?.includes(id) || false,
    isEnrolledInEbook: (id: string) => ebookEnrollments?.includes(id) || false,
  };
}

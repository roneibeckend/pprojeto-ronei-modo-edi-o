import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useEnrollments() {
  const { user } = useAuth();

  const { data: courseEnrollments, isLoading: isLoadingCourses, refetch: refetchCourses } = useQuery({
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
    staleTime: 1000 * 60 * 60, // 1 hour - enrollments are stable
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const { data: ebookEnrollments, isLoading: isLoadingEbooks, refetch: refetchEbooks } = useQuery({
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
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    courseEnrollments: courseEnrollments || [],
    ebookEnrollments: ebookEnrollments || [],
    isLoading: isLoadingCourses || isLoadingEbooks,
    refetchEnrollments: async () => {
      await Promise.all([refetchCourses(), refetchEbooks()]);
    },
    isEnrolledInCourse: (id: string) => courseEnrollments?.includes(id) || false,
    isEnrolledInEbook: (id: string) => ebookEnrollments?.includes(id) || false,
  };
}


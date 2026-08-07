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


  return {
    courseEnrollments: courseEnrollments || [],
    isLoading: isLoadingCourses,
    isEnrolledInCourse: (id: string) => courseEnrollments?.includes(id) || false,
  };
}

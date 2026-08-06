import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type UserRole = "admin" | "moderator" | "user";

export function useAuth() {
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: isAdmin, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (error) {
        console.error("Error checking role:", error);
        return false;
      }
      return !!data;
    },
    enabled: !!session?.user?.id,
  });

  return {
    session,
    user: session?.user ?? null,
    isAdmin: !!isAdmin,
    isLoading: isLoadingSession || isLoadingRole,
  };
}

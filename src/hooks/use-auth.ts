import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type UserRole = "admin" | "manager" | "agent" | "student";

export function useAuth() {
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return "student" as UserRole;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
        return "student" as UserRole;
      }
      return (data?.role as UserRole) || "student";
    },
    enabled: !!session?.user?.id,
  });

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["admin-permissions", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id || userRole === "student") return [];
      const { data } = await supabase
        .from("admin_permissions")
        .select("module, can_access")
        .eq("user_id", session.user.id)
        .eq("can_access", true);
      return data || [];
    },
    enabled: !!session?.user?.id && userRole !== "student" && !isLoadingRole,
  });

  const hasModule = (moduleName: string) => {
    if (userRole === "admin") return true;
    return permissions?.some(p => p.module === moduleName) ?? false;
  };

  return {
    session,
    user: session?.user ?? null,
    role: userRole,
    profile,
    isAdmin: userRole === "admin",
    isManager: userRole === "manager",
    isAgent: userRole === "agent",
    hasModule,
    isLoading: isLoadingSession || isLoadingRole || isLoadingPermissions || isLoadingProfile,
  };
}

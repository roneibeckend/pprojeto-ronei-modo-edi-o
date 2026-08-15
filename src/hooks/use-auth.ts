import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export type UserRole = "admin" | "manager" | "agent" | "student";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["auth-session"],
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile", session?.user?.id],
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 10, // 10 minutes
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

  useEffect(() => {
    const handleProfileUpdate = (event: any) => {
      const { avatar_url } = event.detail;
      queryClient.setQueryData(["user-profile", session?.user?.id], (old: any) => 
        old ? { ...old, avatar_url } : old
      );
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [session?.user?.id, queryClient]);

  return {
    session,
    user: session?.user ?? null,
    role: userRole,
    profile,
    isAdmin: userRole === "admin",
    isStudent: profile?.status === "student",
    isLead: !profile?.status || profile?.status === "lead",
    isManager: userRole === "manager",
    isAgent: userRole === "agent",
    hasModule,
    isLoading: isLoadingSession || isLoadingRole || isLoadingPermissions || isLoadingProfile,
  };
}

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-queries";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const navigate = useNavigate();

  const { data: isAdmin, isLoading: isLoadingRole } = useQuery({
    queryKey: ["is-admin", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: profile.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!isLoadingProfile && !isLoadingRole) {
      if (!profile) {
        navigate({ to: "/auth" });
      } else if (isAdmin === false) {
        navigate({ to: "/app" });
      }
    }
  }, [profile, isAdmin, isLoadingProfile, isLoadingRole, navigate]);

  if (isLoadingProfile || isLoadingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div 
          className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-[#ff6a00]"
        />
      </div>
    );
  }

  if (!isAdmin) return null;

  return <Outlet />;
}

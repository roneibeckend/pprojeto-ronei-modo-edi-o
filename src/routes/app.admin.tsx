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

  useEffect(() => {
    if (!isLoadingProfile) {
      if (!profile) {
        navigate({ to: "/auth" });
      } else if (profile.isAdmin === false) {
        navigate({ to: "/app" });
      }
    }
  }, [profile, isLoadingProfile, navigate]);

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div 
          className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-[#ff6a00]"
        />
      </div>
    );
  }

  if (!profile?.isAdmin) return null;

  return <Outlet />;
}

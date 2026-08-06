import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  component: AppAdminRedirect,
});

function AppAdminRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin", replace: true });
  }, [navigate]);

  return (
    <div className="grid h-64 place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
    </div>
  );
}

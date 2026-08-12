import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Shell } from "@/components/platform/Shell";
import { supabase } from "@/integrations/supabase/client";
import { AsaasPaymentModal } from "@/components/platform/AsaasPaymentModal";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Plataforma — Espetinho na Veia" },
      { name: "description", content: "Área de membros da plataforma Espetinho na Veia — cursos, e-books, receitas e materiais." },
    ],
  }),
  component: AppGate,
});

function AppGate() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Auth session error:", error);
          navigate({ to: "/login", replace: true });
          return;
        }
        if (!data.session) {
          navigate({ to: "/login", replace: true });
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        console.error("Critical auth error:", err);
        if (mounted) navigate({ to: "/login", replace: true });
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) navigate({ to: "/login", replace: true });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Shell>
        <Outlet />
      </Shell>
      <AsaasPaymentModal />
    </>
  );
}

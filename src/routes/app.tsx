import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Shell } from "@/components/platform/Shell";
import { supabase } from "@/integrations/supabase/client";
import { AsaasPaymentModal } from "@/components/platform/AsaasPaymentModal";
import { OnboardingGuide } from "@/components/platform/OnboardingGuide";

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
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error || !session) {
          if (error) console.error("Auth session error:", error);
          const currentPath = window.location.pathname + window.location.search;
          navigate({ to: `/login?redirectTo=${encodeURIComponent(currentPath)}`, replace: true });
          return;
        }

        // Reforçar o carregamento do manifest para PWA se necessário
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
        }

        
        setReady(true);
      } catch (err) {
        console.error("Critical auth error:", err);
        if (mounted) navigate({ to: "/login", replace: true });
      }
    };

    checkAuth();
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

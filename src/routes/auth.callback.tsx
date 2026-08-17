import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  loader: async ({ search }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Se já temos sessão ou se viemos de um fluxo OAuth (o Supabase JS client lida com o hash automaticamente)
    const redirectTo = (search as any).redirectTo || "/inicio";
    
    return redirect({
      to: redirectTo,
    });
  },
  component: () => (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  ),
});

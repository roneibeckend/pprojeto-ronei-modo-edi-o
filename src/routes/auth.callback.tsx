import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: (search.redirectTo as string) || "/inicio",
  }),
  loader: async ({ context: _context }) => {
    // Em TanStack Start, o redirecionamento OAuth lida com a sessão.
    // O router injeta automaticamente o search se validado.
    // Como o loader context é complexo, usamos o redirecionamento imediato.
    await supabase.auth.getSession();
    throw redirect({
      to: "/inicio",
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





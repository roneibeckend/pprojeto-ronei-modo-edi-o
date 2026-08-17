import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type CallbackSearch = {
  redirectTo?: string;
};

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
    redirectTo: (search.redirectTo as string) || "/inicio",
  }),
  loader: async ({ search }: { search: CallbackSearch }) => {
    await supabase.auth.getSession();
    return redirect({
      to: search.redirectTo || "/inicio",
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



import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/setup-admin")({
  component: SetupAdminComponent,
});

function SetupAdminComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Verificar autenticação
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["auth_session_setup"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // 2. Verificar se já existe algum admin
  const { data: adminCount, isLoading: isLoadingCheck } = useQuery({
    queryKey: ["admin_check"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      
      if (error) throw error;
      return count || 0;
    },
  });

  const setupAdmin = useMutation({
    mutationFn: async (userId: string) => {
      // Re-verificar no servidor se ainda está vazio (melhor esforço no client-side)
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (count && count > 0) {
        throw new Error("Já existe um administrador cadastrado.");
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "admin",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta promovida a administrador com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin_check"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Redirecionar para o admin após sucesso
      setTimeout(() => navigate({ to: "/app/admin" }), 2000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao promover conta.");
    },
  });

  useEffect(() => {
    if (!isLoadingSession && !session) {
      toast.error("Você precisa estar logado para acessar esta página.");
      navigate({ to: "/auth" });
    }
  }, [session, isLoadingSession, navigate]);

  if (isLoadingSession || isLoadingCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const hasAdmin = adminCount !== undefined && adminCount > 0;
  const isPending = setupAdmin.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Administrativo</CardTitle>
          <CardDescription>
            Configuração do primeiro acesso de administrador da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAdmin ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Acesso restrito</p>
                <p className="text-sm opacity-90">
                  Já existe pelo menos um administrador cadastrado no sistema. Esta rota temporária está desativada por segurança.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Você está prestes a tornar a conta <strong>{session.user.email}</strong> o primeiro administrador da plataforma.
              </p>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Acesso total ao painel administrativo.</li>
                <li>Gestão de cursos, e-books e receitas.</li>
                <li>Gestão de usuários e matrículas.</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            disabled={hasAdmin || isPending}
            onClick={() => setupAdmin.mutate(session.user.id)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : hasAdmin ? (
              "Já existe um administrador cadastrado"
            ) : (
              "Tornar minha conta administradora"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

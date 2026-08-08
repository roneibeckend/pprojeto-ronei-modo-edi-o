import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error("Erro na autenticação: " + error.message);
        navigate({ to: "/login" });
        return;
      }

      if (session?.user) {
        // Se houver um código de indicação pendente, processar agora
        const refCode = localStorage.getItem('affiliate_referrer_code');
        if (refCode) {
          try {
            // Se o código for do tipo UUID (padrinho)
            if (refCode.length >= 8) {
              // Buscar o ID do afiliado padrinho baseado no prefixo do ID ou código salvo
              // Por simplicidade, vamos tentar encontrar um afiliado cujo ID comece com esse prefixo
              const { data: referrer } = await supabase
                .from('affiliates')
                .select('id')
                .ilike('id', `${refCode}%`)
                .maybeSingle();

              if (referrer && referrer.id !== session.user.id) {
                // Tentar vincular se o usuário ainda não for um afiliado
                const { data: existingAffiliate } = await supabase
                  .from('affiliates')
                  .select('id, referrer_id')
                  .eq('id', session.user.id)
                  .maybeSingle();

                if (existingAffiliate && !existingAffiliate.referrer_id) {
                  await supabase
                    .from('affiliates')
                    .update({ referrer_id: referrer.id })
                    .eq('id', session.user.id);
                } else if (!existingAffiliate) {
                   // Se não existir, será criado quando o usuário solicitar ser afiliado no Shell.tsx
                   // Armazenamos no perfil ou metadata para uso posterior
                   await supabase.auth.updateUser({
                     data: { pending_referrer_id: referrer.id }
                   });
                }
              }
            }
            localStorage.removeItem('affiliate_referrer_code');
          } catch (e) {
            console.error("Erro ao processar indicação:", e);
          }
        }
        
        navigate({ to: "/inicio" });
      } else {
        navigate({ to: "/login" });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex h-dvh items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-fire" />
        <p className="mt-4 text-white/60 font-medium">Finalizando autenticação...</p>
      </div>
    </div>
  );
}
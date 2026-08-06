import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/inicio")({
  component: InicioPage,
});

function InicioPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Como o objetivo é ser o destino pós-login, 
    // se por algum motivo /inicio for apenas um alias, podemos redirecionar para /app
    // ou manter como uma página real se o usuário preferir.
    // Por enquanto, vamos apenas garantir que ela exista.
    navigate({ to: "/app", replace: true });
  }, [navigate]);

  return null;
}

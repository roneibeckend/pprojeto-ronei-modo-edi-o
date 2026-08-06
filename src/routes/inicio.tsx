import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/inicio")({
  component: InicioPage,
});

function InicioPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para o dashboard principal dentro de /app
    navigate({ to: "/app", replace: true });
  }, [navigate]);

  return null;
}

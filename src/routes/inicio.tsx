import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Entrando na área de membros — Espetinho na Veia" },
      { name: "description", content: "Redirecionando você para a sua área de membros Espetinho na Veia." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
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

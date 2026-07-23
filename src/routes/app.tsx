import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/platform/Shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Plataforma — Espetinho na Veia" },
      { name: "description", content: "Área de membros da plataforma Espetinho na Veia — cursos, e-books, receitas e materiais." },
    ],
  }),
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});

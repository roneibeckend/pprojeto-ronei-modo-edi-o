import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/cursos")({
  component: () => <Outlet />,
});

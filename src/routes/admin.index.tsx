import { createFileRoute } from "@tanstack/react-router";
import { adminStats } from "@/lib/platform-data";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="p-6 rounded-xl border border-white/10 bg-[#111]">
        <div className="text-sm text-white/40">Total Alunos</div>
        <div className="text-3xl font-bold mt-2">{adminStats.students}</div>
      </div>
      <div className="p-6 rounded-xl border border-white/10 bg-[#111]">
        <div className="text-sm text-white/40">Faturamento</div>
        <div className="text-3xl font-bold mt-2">{adminStats.revenue}</div>
      </div>
      <div className="p-6 rounded-xl border border-white/10 bg-[#111]">
        <div className="text-sm text-white/40">Cursos Ativos</div>
        <div className="text-3xl font-bold mt-2">{adminStats.activeCourses}</div>
      </div>
      <div className="p-6 rounded-xl border border-white/10 bg-[#111]">
        <div className="text-sm text-white/40">E-books</div>
        <div className="text-3xl font-bold mt-2">{adminStats.ebooks}</div>
      </div>
    </div>
  );
}

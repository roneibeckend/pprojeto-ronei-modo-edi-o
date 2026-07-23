import { createFileRoute } from "@tanstack/react-router";
import { Users, GraduationCap, BookOpen, Play, TrendingUp, Activity, Plus, Settings, Video, ChefHat, FileSpreadsheet, Award, Calculator, Trash2, DollarSign, PieChart } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/platform/Shell";
import { adminStats } from "@/lib/platform-data";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — Espetinho na Veia" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Painel administrativo"
        subtitle="Visão geral e gerenciamento da plataforma."
        action={<button className="btn-fire text-sm"><Settings className="h-4 w-4" /> Configurações</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat icon={Users} label="Alunos" value={adminStats.students.toLocaleString("pt-BR")} />
        <AdminStat icon={GraduationCap} label="Cursos ativos" value={String(adminStats.activeCourses)} />
        <AdminStat icon={BookOpen} label="E-books cadastrados" value={String(adminStats.ebooks)} />
        <AdminStat icon={Play} label="Aulas assistidas" value={adminStats.lessonsWatched.toLocaleString("pt-BR")} />
        <AdminStat icon={TrendingUp} label="Conclusão média" value={`${adminStats.avgCompletion}%`} accent />
        <AdminStat icon={Activity} label="Ativos recentemente" value={String(adminStats.activeRecent)} />
        <AdminStat icon={Award} label="Certificados emitidos" value="1.284" />
        <AdminStat icon={TrendingUp} label="Faturamento" value={adminStats.revenue} accent />
      </div>

      <section className="glass mt-8 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Alunos ativos nos últimos meses</h3>
          <div className="text-xs text-muted-foreground">últimos 12 meses</div>
        </div>
        <div className="mt-6 flex h-48 items-end gap-2">
          {adminStats.chart.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-fire" style={{ height: `${v * 1.5}%`, opacity: 0.5 + v / 200 }} />
              <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminAction icon={GraduationCap} title="Cadastrar curso" desc="Crie um novo curso e organize módulos." />
        <AdminAction icon={Video} title="Upload de vídeos" desc="Envie aulas em MP4 direto para as trilhas." />
        <AdminAction icon={BookOpen} title="Cadastrar e-book" desc="Publique um novo material na biblioteca." />
        <AdminAction icon={ChefHat} title="Cadastrar receita" desc="Adicione receitas com custo e lucro." />
        <AdminAction icon={FileSpreadsheet} title="Novo material" desc="Planilhas, PDFs e artes de divulgação." />
        <AdminAction icon={Users} title="Gerenciar alunos" desc="Consulte, edite e libere acessos." />
      </section>

      <FinancePanel />

      <section className="glass mt-8 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Últimos alunos cadastrados</h3>
          <button className="btn-ghost-fire text-xs">Ver todos</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-3">Aluno</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">Curso principal</th>
                <th className="pb-3">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["André Silva", "andre@exemplo.com", "Espetinho Lucrativo", "42%"],
                ["Mariana Costa", "mari@exemplo.com", "Molhos e Acompanhamentos", "78%"],
                ["Carlos Mendes", "carlos@exemplo.com", "Como Vender Mais", "15%"],
                ["Fernanda Rocha", "fe@exemplo.com", "Gestão do Negócio", "60%"],
                ["Tiago Almeida", "tiago@exemplo.com", "Espetinho Lucrativo", "92%"],
              ].map((r) => (
                <tr key={r[1]} className="border-t border-white/5">
                  <td className="py-3 font-medium">{r[0]}</td>
                  <td className="py-3 text-muted-foreground">{r[1]}</td>
                  <td className="py-3">{r[2]}</td>
                  <td className="py-3"><span className="rounded-full bg-fire/20 px-2 py-0.5 text-xs text-primary">{r[3]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${accent ? "gradient-border" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire/20 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function AdminAction({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <button className="glass card-tilt group rounded-2xl p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fire text-white shadow-fire">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-bold">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
        <Plus className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
      </div>
    </button>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/admin/alunos")({
  head: () => ({ meta: [{ title: "Gestão de Alunos — Painel Admin" }] }),
  component: StudentsPage,
});

const ORANGE = "#ff6a00";

const studentsData = [
  { id: 1, name: "André Silva", email: "andre@exemplo.com", course: "Do Zero aos 10k", progress: 42, lastActive: "Hoje", status: "Ativo" },
  { id: 2, name: "Mariana Costa", email: "mari@exemplo.com", course: "Técnicas Avançadas", progress: 78, lastActive: "Ontem", status: "Ativo" },
  { id: 3, name: "Carlos Mendes", email: "carlos@exemplo.com", course: "Molhos e Acompanhamentos", progress: 15, lastActive: "Há 3 dias", status: "Ativo" },
  { id: 4, name: "Fernanda Rocha", email: "fe@exemplo.com", course: "Máquina de Vendas", progress: 60, lastActive: "Hoje", status: "Ativo" },
  { id: 5, name: "Tiago Almeida", email: "tiago@exemplo.com", course: "Do Zero aos 10k", progress: 92, lastActive: "Há 1 semana", status: "Inativo" },
  { id: 6, name: "Juliana Lima", email: "ju@exemplo.com", course: "Técnicas Avançadas", progress: 100, lastActive: "Há 2 dias", status: "Ativo" },
  { id: 7, name: "Ricardo Santos", email: "ric@exemplo.com", course: "Máquina de Vendas", progress: 5, lastActive: "Hoje", status: "Ativo" },
  { id: 8, name: "Beatriz Oliveira", email: "bia@exemplo.com", course: "Do Zero aos 10k", progress: 34, lastActive: "Há 4 dias", status: "Ativo" },
];

function StudentsPage() {
  const [search, setSearch] = useState("");

  const filteredStudents = studentsData.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total de Alunos</div>
            <Users className="h-4 w-4 text-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE }} />
          </div>
          <div className="text-3xl font-display font-extrabold text-white">2.847</div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <TrendingUp className="h-3 w-3" /> +12% este mês
          </div>
        </div>
        <div className="border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Alunos Ativos</div>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-display font-extrabold text-white">412</div>
          <div className="mt-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Acessaram nas últimas 24h</div>
        </div>
        <div className="border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Conclusão Média</div>
            <ChevronRight className="h-4 w-4 text-white/20" />
          </div>
          <div className="text-3xl font-display font-extrabold text-white">62%</div>
          <div className="mt-2 h-1 w-full bg-white/5">
             <div className="h-full bg-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE, width: '62%' }} />
          </div>
        </div>
      </div>

      <section className="border border-white/5 bg-[#111]">
        <div className="flex flex-col gap-4 border-b border-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1" style={{ backgroundColor: ORANGE }} />
            <div>
              <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-white">
                Acompanhamento Analítico
              </h3>
              <p className="text-xs text-white/40">Listagem detalhada de progresso</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input 
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-sm border border-white/10 bg-black py-2 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-[color:var(--orange)] sm:w-64"
                style={{ ["--orange" as any]: ORANGE }}
              />
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 text-white/40 hover:text-white transition">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.22em] text-white/40">
                <th className="px-6 py-4 font-bold">Aluno</th>
                <th className="px-6 py-4 font-bold">Curso Atual</th>
                <th className="px-6 py-4 font-bold">Progresso</th>
                <th className="px-6 py-4 font-bold">Último Acesso</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student, i) => {
                const initials = student.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                return (
                  <tr 
                    key={student.id} 
                    className="group animate-in fade-in slide-in-from-left-2 duration-300"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-sm bg-[#111] border border-white/10 text-[10px] font-bold text-white/40 group-hover:border-[color:var(--orange)] group-hover:text-white transition-colors" style={{ ["--orange" as any]: ORANGE }}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[color:var(--orange)] transition-colors" style={{ ["--orange" as any]: ORANGE }}>{student.name}</div>
                          <div className="text-[11px] text-white/30">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{student.course}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-20 overflow-hidden bg-white/5">
                          <div 
                            className="h-full bg-[color:var(--orange)]" 
                            style={{ ["--orange" as any]: ORANGE, width: `${student.progress}%` }} 
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white/80">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs">{student.lastActive}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        student.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-white/20 hover:text-white transition">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-white/20 hover:text-white transition">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="p-20 text-center">
             <Users className="h-10 w-10 text-white/5 mx-auto mb-4" />
             <p className="text-sm text-white/20">Nenhum aluno encontrado para "{search}"</p>
          </div>
        )}

        <div className="border-t border-white/5 p-4 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Exibindo {filteredStudents.length} de {studentsData.length} registros
          </div>
          <div className="flex items-center gap-1">
             <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/20 border border-white/5 hover:border-white/10 hover:text-white transition">Anterior</button>
             <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white border border-white/10 hover:bg-white/5 transition">Próximo</button>
          </div>
        </div>
      </section>
    </div>
  );
}

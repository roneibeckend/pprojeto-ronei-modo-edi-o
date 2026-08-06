import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users as UsersIcon, 
  DollarSign, 
  Library, 
  BookOpen,
  Loader2,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  Activity
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        studentsRes,
        coursesRes,
        ebooksRes,
        enrollmentsRes,
        ticketsRes,
        recentLogsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('id'),
        supabase.from('ebooks').select('id'),
        supabase.from('course_enrollments' as any).select('id', { count: 'exact' }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('integration_logs' as any).select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      return {
        students: studentsRes.count || 0,
        courses: coursesRes.data?.length || 0,
        ebooks: ebooksRes.data?.length || 0,
        sales: enrollmentsRes.count || 0,
        revenue: (enrollmentsRes.count || 0) * 197.00,
        pendingTickets: ticketsRes.count || 0,
        recentLogs: recentLogsRes.data || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  const cards = [
    { label: "Total Alunos", value: stats?.students, icon: UsersIcon, color: "text-blue-400" },
    { label: "Vendas Realizadas", value: stats?.sales, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Cursos Ativos", value: stats?.courses, icon: Library, color: "text-[#ff6a00]" },
    { label: "Suporte Pendente", value: stats?.pendingTickets, icon: AlertCircle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="p-6 rounded-xl border border-white/5 bg-[#111] group hover:border-white/10 transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Real-time</span>
            </div>
            <div className="text-3xl font-bold tracking-tight">{card.value}</div>
            <div className="text-xs text-white/40 mt-1 uppercase tracking-wider font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold uppercase tracking-tight">Atalhos Rápidos</h3>
          </div>
          <div className="grid gap-3">
            {[
              { to: "/admin/cursos", label: "Gerenciar Catálogo de Cursos" },
              { to: "/admin/ebooks", label: "Biblioteca de E-books" },
              { to: "/admin/alunos", label: "Base de Alunos e Matrículas" },
              { to: "/admin/suporte", label: "Central de Suporte (Tickets)", highlight: (stats?.pendingTickets || 0) > 0 },
              { to: "/admin/receitas", label: "Central de Receitas" },
            ].map((link, i) => (
              <Link 
                key={i} 
                to={link.to}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{link.label}</span>
                  {link.highlight && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-[#ff6a00] transition" />
              </Link>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/5 bg-[#111] flex flex-col justify-center items-center text-center">
          <div className="h-16 w-16 rounded-full bg-[#ff6a00]/10 flex items-center justify-center text-[#ff6a00] mb-4">
            <DollarSign className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.revenue || 0)}
          </h3>
          <p className="text-sm text-white/40 mt-1 uppercase tracking-widest font-bold">Faturamento Estimado</p>
          <p className="text-[10px] text-white/20 mt-4 max-w-[200px]">Cálculo baseado no volume de matrículas e ticket médio da plataforma.</p>
        </div>
      </div>
    </div>
  );
}

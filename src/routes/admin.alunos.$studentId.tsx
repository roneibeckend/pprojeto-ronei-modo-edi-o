import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronLeft, 
  Loader2,
  BookOpen,
  Trophy,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageHeader } from "@/components/platform/Shell";

export const Route = createFileRoute("/admin/alunos/$studentId")({
  head: () => ({ meta: [{ title: "Perfil do Aluno · Admin" }] }),
  component: AdminStudentProfilePage,
});

function AdminStudentProfilePage() {
  const { studentId } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    lessonsWatched: 0,
    totalSpent: 0
  });

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  async function fetchStudentData() {
    try {
      setLoading(true);
      
      // Fetch basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
        
      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch enrollments and associated courses
      const { data: enrollData, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(title, cover_url)
        `)
        .eq('user_id', studentId);

      if (enrollError) throw enrollError;
      setEnrollments(enrollData || []);

      // Fetch progress stats
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', studentId)
        .eq('is_completed', true);
      
      setStats({
        coursesCompleted: 0, // Simplified as we don't have progress in course_enrollments yet
        lessonsWatched: progressData?.length || 0,
        totalSpent: 0 
      });

    } catch (error: any) {
      toast.error("Erro ao carregar dados do aluno: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Aluno não encontrado</h2>
        <button 
          onClick={() => window.history.back()}
          className="text-[#ff6a00] hover:underline flex items-center gap-2 mx-auto"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para listagem
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader 
          title={`Perfil: ${profile.name || "Sem Nome"}`} 
          subtitle="Visualize o progresso e informações detalhadas do aluno." 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        {/* Profile Info Card */}
        <aside className="space-y-6">
          <section className="glass overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="h-24 bg-gradient-to-br from-[#ff6a00] to-[#ff9500] opacity-20" />
            <div className="relative -mt-12 flex flex-col items-center p-6 text-center">
              <div className="h-24 w-24 rounded-2xl border-4 border-[#0a0a0a] bg-[#ff6a00]/10 flex items-center justify-center text-[#ff6a00] text-3xl font-bold ring-1 ring-white/10">
                {profile.name?.charAt(0) || "A"}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{profile.name || "Sem Nome"}</h3>
              <p className="text-sm text-white/40">Membro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : "—"}</p>
              
              <div className="mt-6 grid w-full grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.03] p-3 text-center border border-white/5">
                  <div className="text-lg font-bold text-[#ff6a00]">{stats.lessonsWatched}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Aulas</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-center border border-white/5">
                  <div className="text-lg font-bold text-[#ff6a00]">{stats.coursesCompleted}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Cursos</div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <History className="w-3 h-3" /> Detalhes de Contato
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-[#ff6a00]">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">E-mail</div>
                  <div className="truncate text-sm font-medium">{profile.email || "Não informado"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-[#ff6a00]">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Telefone</div>
                  <div className="truncate text-sm font-medium">{profile.phone || "Não informado"}</div>
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* Main Content: Courses and Activity */}
        <div className="space-y-8">
          <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6a00]/10 text-[#ff6a00]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">Cursos Matriculados</h3>
                <p className="text-sm text-white/40">Visão geral do progresso acadêmico do aluno.</p>
              </div>
            </div>

            <div className="grid gap-4">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition">
                    <img 
                      src={enrollment.course?.cover_url || "/placeholder.svg"} 
                      alt={enrollment.course?.title}
                      className="w-16 h-16 rounded-lg object-cover bg-white/5"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{enrollment.course?.title}</h4>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#ff6a00] to-[#ff9500] transition-all duration-1000"
                            style={{ width: `0%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#ff6a00]">0%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <p className="text-sm text-white/20 uppercase tracking-widest font-bold">Nenhum curso matriculado</p>
                </div>
              )}
            </div>
          </section>

          {/* Activity Placeholder */}
          <section className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8">
             <div className="flex items-center gap-3 mb-6">
                <History className="w-5 h-5 text-[#ff6a00]" />
                <h3 className="font-display text-xl font-bold text-white">Atividade Recente</h3>
             </div>
             <p className="text-sm text-white/20 text-center py-8 italic">Dados de atividade detalhados serão integrados em breve.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

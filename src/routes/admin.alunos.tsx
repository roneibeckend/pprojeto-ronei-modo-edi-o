import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Loader2,
  TrendingUp,
  GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/alunos")({
  head: () => ({ meta: [{ title: "Gestão de Alunos · Admin" }] }),
  component: AdminAlunosPage,
});

function AdminAlunosPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar alunos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestão de Alunos</h2>
          <p className="text-sm text-white/40 text-left">Acompanhe e gerencie todos os alunos matriculados.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-white/20" />
        <input 
          placeholder="Buscar por nome ou e-mail..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 py-2.5 pl-10 pr-4 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#111]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Aluno</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Contato</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Matrícula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.01] transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#ff6a00]/10 flex items-center justify-center text-[#ff6a00] font-bold text-xs">
                        {p.full_name?.charAt(0) || "A"}
                      </div>
                      <span className="font-medium">{p.full_name || "Sem Nome"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/40">{p.email}</td>
                  <td className="px-6 py-4 text-white/40">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

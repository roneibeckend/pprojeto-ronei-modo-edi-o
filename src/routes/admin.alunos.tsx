import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Loader2,
  TrendingUp,
  GraduationCap,
  Trash2,
  Edit3,
  X,
  Mail,
  Calendar,
  Phone,
  UserCheck
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, search]);

  async function fetchData() {
    try {
      setLoading(true);
      
      let query = supabase.from('profiles').select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
        
      if (error) throw error;
      setProfiles(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Erro ao carregar alunos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { error } = await supabase.from('profiles').upsert(editingItem);
      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este aluno? Esta ação não exclui a conta de autenticação, apenas o perfil e dados associados na tabela public.profiles.")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success("Aluno removido com sucesso");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
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
          onChange={e => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
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
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.01] transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#ff6a00]/10 flex items-center justify-center text-[#ff6a00] font-bold text-xs">
                        {p.name?.charAt(0) || "A"}
                      </div>
                      <span className="font-medium">{p.name || "Sem Nome"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/40">{p.email || "—"}</td>
                  <td className="px-6 py-4 text-white/40">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingItem(p); setIsModalOpen(true); }}
                        className="p-2 text-white/40 hover:text-white transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-white/40 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Editar Aluno</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nome Completo</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
                    <input required value={editingItem?.name || ""} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 pl-10 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
                    <input required type="email" value={editingItem?.email || ""} onChange={e => setEditingItem({...editingItem, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 pl-10 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
                    <input value={editingItem?.phone || ""} onChange={e => setEditingItem({...editingItem, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 pl-10 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 font-bold hover:bg-white/10 transition uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3.5 rounded-xl bg-[#ff6a00] text-black font-bold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition uppercase tracking-widest text-xs">
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

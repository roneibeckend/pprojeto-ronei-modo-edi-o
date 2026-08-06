import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Library, 
  Trash2, 
  Edit3, 
  Loader2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveContent } from "@/lib/content-admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cursos")({
  head: () => ({ meta: [{ title: "Gestão de Cursos · Admin" }] }),
  component: AdminCursosPage,
});

function AdminCursosPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar cursos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      await saveContent({ data: { ...editingItem, type: 'course' } });
      toast.success("Curso salvo com sucesso!");
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      toast.success("Curso excluído");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestão de Cursos</h2>
          <p className="text-sm text-white/40 text-left">Gerencie o catálogo de cursos da plataforma.</p>
        </div>
        <button 
          onClick={() => { setEditingItem({ is_ai_generated: false }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#ff6a00] px-4 py-2 rounded-lg text-sm font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Novo Curso
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course.id} className="p-4 rounded-xl border border-white/5 bg-[#111] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-[#ff6a00]/10 flex items-center justify-center text-[#ff6a00]">
                  <Library className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">{course.title}</h3>
                  <p className="text-xs text-white/40 text-left">{course.price ? `R$ ${course.price.toFixed(2)}` : "Grátis"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingItem(course); setIsModalOpen(true); }} className="p-2 text-white/40 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(course.id)} className="p-2 text-white/40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-xl bg-[#0e0e0e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem?.id ? "Editar Curso" : "Novo Curso"}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título</label>
                  <input required value={editingItem?.title || ""} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Professor</label>
                  <input value={editingItem?.teacher_name || ""} onChange={e => setEditingItem({...editingItem, teacher_name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preço (R$)</label>
                  <input type="number" step="0.01" value={editingItem?.price || ""} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Badge (Ex: Mais Vendido)</label>
                  <input value={editingItem?.badge || ""} onChange={e => setEditingItem({...editingItem, badge: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Descrição</label>
                <textarea rows={2} value={editingItem?.description || ""} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">URL da Imagem de Capa</label>
                <div className="flex gap-2">
                  <input 
                    value={editingItem?.cover_url || ""} 
                    onChange={e => setEditingItem({...editingItem, cover_url: e.target.value})} 
                    placeholder="https://images.unsplash.com/..." 
                    className="flex-1 bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
                  />
                </div>
                <p className="text-[9px] text-white/30 italic">Recomendado: 1280x720px ou proporção 16:9.</p>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingItem?.is_locked || false} 
                    onChange={e => setEditingItem({...editingItem, is_locked: e.target.checked})}
                    className="accent-[#ff6a00]"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Bloqueado para Venda</span>
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-lg bg-white/5 font-bold hover:bg-white/10">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-lg bg-[#ff6a00] text-black font-bold disabled:opacity-50">{isSaving ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

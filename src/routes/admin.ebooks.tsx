import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  Edit3, 
  Loader2,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveContent } from "@/lib/content-admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ebooks")({
  head: () => ({ meta: [{ title: "Gestão de E-books · Admin" }] }),
  component: AdminEbooksPage,
});

function AdminEbooksPage() {
  const [ebooks, setEbooks] = useState<any[]>([]);
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
      const { data, error } = await supabase.from('ebooks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEbooks(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar e-books: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      await saveContent({ data: { ...editingItem, type: 'ebook' } });
      toast.success("E-book salvo com sucesso!");
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
      const { error } = await supabase.from('ebooks').delete().eq('id', id);
      if (error) throw error;
      toast.success("E-book excluído");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestão de E-books</h2>
          <p className="text-sm text-white/40 text-left">Gerencie a biblioteca de e-books manuais.</p>
        </div>
        <button 
          onClick={() => { setEditingItem({ is_ai_generated: false }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#ff6a00] px-4 py-2 rounded-lg text-sm font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Novo E-book
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
        </div>
      ) : (
        <div className="grid gap-4">
          {ebooks.map((ebook) => (
            <div key={ebook.id} className="p-4 rounded-xl border border-white/5 bg-[#111] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-[#ff6a00]/10 flex items-center justify-center text-[#ff6a00]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">{ebook.title}</h3>
                  <p className="text-xs text-white/40 text-left">{ebook.price ? `R$ ${ebook.price.toFixed(2)}` : "Grátis"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingItem(ebook); setIsModalOpen(true); }} className="p-2 text-white/40 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(ebook.id)} className="p-2 text-white/40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-xl bg-[#0e0e0e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem?.id ? "Editar E-book" : "Novo E-book"}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título</label>
                <input required value={editingItem?.title || ""} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preço</label>
                <input type="number" step="0.01" value={editingItem?.price || ""} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
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

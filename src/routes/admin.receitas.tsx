import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  ChefHat, 
  Trash2, 
  Edit3, 
  Loader2,
  X,
  Clock,
  Users,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/receitas")({
  head: () => ({ meta: [{ title: "Gestão de Receitas · Admin" }] }),
  component: AdminReceitasPage,
});

function AdminReceitasPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ["Carne bovina", "Frango", "Linguiça", "Suíno", "Queijo", "Vegetarianos", "Molhos", "Acompanhamentos"];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRecipes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar receitas: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { error } = await supabase.from('recipes').upsert(editingItem);
      if (error) throw error;
      
      toast.success("Receita salva com sucesso!");
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
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      toast.success("Receita excluída");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Gestão de Receitas</h2>
          <p className="text-sm text-white/40 text-left">Gerencie as receitas disponíveis para os alunos.</p>
        </div>
        <button 
          onClick={() => { setEditingItem({ 
            name: "", 
            category: "Carne bovina", 
            difficulty: "Fácil",
            ingredients: [],
            steps: [],
            is_published: true
          }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#ff6a00] px-4 py-2 rounded-lg text-sm font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Nova Receita
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111] transition-all hover:border-[#ff6a00]/30">
              <div className="aspect-video w-full bg-white/5 overflow-hidden">
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.name} className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/10">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00]">{recipe.category}</span>
                    {!recipe.is_published && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded text-white/40">Oculto</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingItem(recipe); setIsModalOpen(true); }} className="p-1.5 text-white/40 hover:text-white transition"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(recipe.id)} className="p-1.5 text-white/40 hover:text-red-500 transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <h3 className="mt-1 font-bold">{recipe.name}</h3>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                   <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.prep_time || "N/A"}</span>
                   <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {recipe.yield || "N/A"}</span>
                   <span className="flex items-center gap-1 text-[#ff6a00]"><TrendingUp className="h-3 w-3" /> {recipe.profit_margin || "N/A"}</span>
                </div>
              </div>
            </div>
          ))}
          {recipes.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl">
              <ChefHat className="h-10 w-10 mx-auto text-white/10 mb-3" />
              <p className="text-white/40 text-sm">Nenhuma receita cadastrada ainda.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">{editingItem?.id ? "Editar Receita" : "Nova Receita"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nome da Receita</label>
                  <input required value={editingItem?.name || ""} onChange={e => setEditingItem({...editingItem, name: e.target.value})} placeholder="Ex: Alcatra Premium" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Categoria</label>
                  <select value={editingItem?.category || ""} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-[#0e0e0e] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                 <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tempo de Preparo</label>
                  <input value={editingItem?.prep_time || ""} onChange={e => setEditingItem({...editingItem, prep_time: e.target.value})} placeholder="Ex: 35 min" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Rendimento</label>
                  <input value={editingItem?.yield || ""} onChange={e => setEditingItem({...editingItem, yield: e.target.value})} placeholder="Ex: 6 espetos" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Margem de Lucro</label>
                  <input value={editingItem?.profit_margin || ""} onChange={e => setEditingItem({...editingItem, profit_margin: e.target.value})} placeholder="Ex: 212%" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Custo Unitário</label>
                  <input value={editingItem?.cost || ""} onChange={e => setEditingItem({...editingItem, cost: e.target.value})} placeholder="Ex: R$ 3,20" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preço Sugerido</label>
                  <input value={editingItem?.sell_price || ""} onChange={e => setEditingItem({...editingItem, sell_price: e.target.value})} placeholder="Ex: R$ 10,00" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nível de Dificuldade</label>
                  <select 
                    value={editingItem?.difficulty || "Fácil"} 
                    onChange={e => setEditingItem({...editingItem, difficulty: e.target.value})} 
                    className="w-full bg-[#0e0e0e] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">URL da Imagem</label>
                  <input value={editingItem?.image_url || ""} onChange={e => setEditingItem({...editingItem, image_url: e.target.value})} placeholder="https://..." className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    onClick={() => setEditingItem({...editingItem, is_published: !editingItem.is_published})}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${editingItem.is_published ? 'bg-[#ff6a00]' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-transform ${editingItem.is_published ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-bold text-white/60 group-hover:text-white transition">Publicar receita (visível para alunos)</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ingredientes (Um por linha)</label>
                <textarea 
                  rows={4}
                  value={editingItem?.ingredients?.join('\n') || ""} 
                  onChange={e => setEditingItem({...editingItem, ingredients: e.target.value.split('\n').filter(Boolean)})}
                  placeholder="500g de alcatra\nSal grosso..."
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] resize-none" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Modo de Preparo (Um passo por linha)</label>
                <textarea 
                  rows={4}
                  value={editingItem?.steps?.join('\n') || ""} 
                  onChange={e => setEditingItem({...editingItem, steps: e.target.value.split('\n').filter(Boolean)})}
                  placeholder="Corte em cubos...\nTempere..."
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] resize-none" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 font-bold hover:bg-white/10 transition uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3.5 rounded-xl bg-[#ff6a00] text-black font-bold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition uppercase tracking-widest text-xs">
                  {isSaving ? "Salvando..." : "Salvar Receita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

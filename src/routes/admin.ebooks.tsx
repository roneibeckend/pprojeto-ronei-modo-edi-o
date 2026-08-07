import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  Edit3, 
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Archive,
  Copy,
  Info,
  Layout,
  Users,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  async function fetchData() {
    try {
      setLoading(true);
      let query = supabase
        .from('ebooks')
        .select('*, modules:ebook_modules(id, chapters:ebook_chapters(id))', { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
        
      if (error) throw error;
      setEbooks(data || []);
      setTotalCount(count || 0);
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
      const { data, error } = await supabase
        .from('ebooks')
        .upsert({
          ...editingItem,
          id: editingItem.id || undefined
        })
        .select()
        .single();

      if (error) throw error;
      
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

  async function handleDelete(ebook: any) {
    if (!confirm(`Tem certeza que deseja excluir o e-book "${ebook.title}"?`)) return;
    try {
      const { error } = await supabase.from('ebooks').delete().eq('id', ebook.id);
      if (error) throw error;
      toast.success("E-book excluído");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Gestão de E-books</h2>
          <p className="text-sm text-white/40 text-left">Gerencie sua biblioteca de livros digitais.</p>
        </div>
        <button 
          onClick={() => { 
            setEditingItem({ 
              title: "", 
              price: 0,
              is_locked: false
            }); 
            setIsModalOpen(true); 
          }}
          className="flex items-center justify-center gap-2 bg-[#ff6a00] px-4 py-2.5 rounded-lg text-sm font-bold text-black hover:bg-[#ff8c33] transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo E-book
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#111] p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input 
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors text-[16px] md:text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
        </div>
      ) : ebooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <BookOpen className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/40 text-sm">Nenhum e-book encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#111]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4">Capa / Título</th>
                <th className="px-6 py-4">Conteúdo</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ebooks.map((ebook) => (
                <tr key={ebook.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {ebook.cover_url || ebook.cover ? (
                        <img src={ebook.cover_url || ebook.cover} alt={ebook.title} className="h-12 w-8 object-cover rounded bg-white/5" />
                      ) : (
                        <div className="h-12 w-8 rounded bg-white/5 flex items-center justify-center text-white/20">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{ebook.title}</div>
                        <div className="text-[10px] text-white/20 uppercase tracking-tighter">
                          ID: {ebook.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{ebook.modules?.length || 0} Módulos</span>
                      <span className="text-[10px] text-white/40">
                        {ebook.modules?.reduce((acc: number, m: any) => acc + (m.chapters?.length || 0), 0) || 0} Capítulos
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gold font-bold">R$ {ebook.price?.toString().replace(".", ",")}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => { setEditingItem(ebook); setIsModalOpen(true); }}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(ebook)}
                        className="p-2 text-white/40 hover:text-red-500 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 my-8 min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem?.id ? `Editando: ${editingItem.title}` : "Novo E-book"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <Tabs defaultValue="info" className="flex-1 flex flex-col">
              <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 self-start">
                <TabsTrigger value="info" className="flex items-center gap-2 data-[state=active]:bg-[#ff6a00] data-[state=active]:text-black">
                  <Info className="h-4 w-4" /> Informações
                </TabsTrigger>
                <TabsTrigger value="content" disabled={!editingItem?.id} className="flex items-center gap-2 data-[state=active]:bg-[#ff6a00] data-[state=active]:text-black">
                  <Layout className="h-4 w-4" /> Capítulos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 mt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título do E-book</label>
                        <input 
                          required 
                          value={editingItem?.title || ""} 
                          onChange={e => setEditingItem({...editingItem, title: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors" 
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Subtítulo</label>
                        <input 
                          value={editingItem?.subtitle || ""} 
                          onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Descrição</label>
                        <textarea 
                          value={editingItem?.description || ""} 
                          onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors resize-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <ImageUpload 
                        value={editingItem?.cover_url || editingItem?.cover || ""} 
                        onChange={url => setEditingItem({...editingItem, cover_url: url})}
                        bucket="content-covers"
                        label="Imagem de Capa"
                        description="Proporção 3:4 recomendada para e-books."
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preço (R$)</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={editingItem?.price || 0} 
                            onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} 
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Categoria</label>
                          <input 
                            value={editingItem?.category || ""} 
                            onChange={e => setEditingItem({...editingItem, category: e.target.value})} 
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-white/5">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-[#ff6a00] px-8 py-3 rounded-lg text-sm font-bold text-black hover:bg-[#ff8c33] disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Salvar E-book
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="content" className="flex-1 mt-0">
                <div className="flex flex-col items-center justify-center py-20 text-center text-white/20">
                  <Layout className="h-12 w-12 mb-4" />
                  <p>A ferramenta de edição de módulos e capítulos está sendo otimizada.</p>
                  <p className="text-xs mt-2">Para gerenciar o conteúdo agora, utilize o Painel do Banco de Dados.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

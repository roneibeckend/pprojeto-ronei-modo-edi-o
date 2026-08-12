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
  Settings,
  ChevronDown,
  GripVertical,
  Save,
  SendHorizontal,
  Play,
  FileUp,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { importEbookFromFile } from "@/lib/ebook-import.functions";
import { fixEbookVisibility } from "@/lib/ebook-visibility-fix.functions";

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
      // Prepare data for upsert, ensuring no virtual 'modules' column is sent
      const { modules, ...payload } = editingItem;
      
      const { data, error } = await supabase
        .from('ebooks')
        .upsert({
          ...payload,
          id: editingItem.id || undefined,
          updated_at: new Date().toISOString()
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
              subtitle: "",
              description: "",
              price: 0,
              is_locked: false,
              category: "",
              cover_url: "",
              payment_type: "unique"
            }); 
            setIsModalOpen(true); 
          }}
          className="flex items-center justify-center gap-2 bg-[#ff6a00] px-4 py-2.5 rounded-lg text-sm font-bold text-black hover:bg-[#ff8c33] transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar Novo E-book
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                fetchData();
              }
            }}
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
                        onClick={async () => {
                          try {
                            await fixEbookVisibility({ data: { ebook_id: ebook.id, user_email: 'newdroidsk8@gmail.com' } });
                            toast.success("Visibilidade corrigida!");
                            fetchData();
                          } catch (err: any) {
                            toast.error("Erro ao corrigir: " + err.message);
                          }
                        }}
                        className="p-2 text-white/40 hover:text-gold transition-colors"
                        title="Corrigir Visibilidade"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 text-left overflow-y-auto outline-none" tabIndex={-1}>
          <div className="w-full max-w-4xl bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 my-8 min-h-[600px] flex flex-col relative z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-6 sticky top-0 z-30 bg-[#0e0e0e] pb-4 border-b border-white/5 pt-2">
              <h3 className="text-xl font-bold truncate pr-4">{editingItem?.id ? `Editando: ${editingItem.title}` : "Novo E-book"}</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }} 
                className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Tabs defaultValue="info" className="flex-1 flex flex-col" onValueChange={() => {
              const modalOverlay = document.querySelector('.fixed.inset-0.z-50');
              if (modalOverlay) modalOverlay.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 self-start sticky top-0 z-20 backdrop-blur-md">
                <TabsTrigger value="info" className="flex items-center gap-2 data-[state=active]:bg-[#ff6a00] data-[state=active]:text-black">
                  <Info className="h-4 w-4" /> Informações
                </TabsTrigger>
                <TabsTrigger value="content" disabled={!editingItem?.id} className="flex items-center gap-2 data-[state=active]:bg-[#ff6a00] data-[state=active]:text-black">
                  <Layout className="h-4 w-4" /> Capítulos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 mt-0 outline-none">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tipo de Pagamento</label>
                          <select 
                            value={editingItem?.payment_type || "unique"} 
                            onChange={e => setEditingItem({...editingItem, payment_type: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] appearance-none cursor-pointer"
                          >
                            <option value="unique">Pagamento Único</option>
                            <option value="recurring">Pagamento Recorrente</option>
                          </select>
                        </div>
                        
                        {editingItem?.payment_type === 'recurring' && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Dias úteis p/ vencimento</label>
                            <input 
                              type="number"
                              required
                              min="1"
                              step="1"
                              value={editingItem?.due_days || 3} 
                              onChange={e => setEditingItem({...editingItem, due_days: parseInt(e.target.value) || 1})} 
                              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors" 
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <VideoUpload 
                          value={editingItem?.opening_video_url || ""} 
                          onChange={url => setEditingItem({...editingItem, opening_video_url: url})}
                          label="Vídeo de Abertura"
                          description="Este vídeo será exibido antes do início do conteúdo para o aluno."
                        />
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

              <TabsContent value="content" className="flex-1 mt-0 outline-none">
                {editingItem?.id && <EbookContentEditor ebookId={editingItem.id} />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

function EbookContentEditor({ ebookId }: { ebookId: string }) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [ebookId]);

  async function fetchContent() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ebook_modules')
        .select('*, chapters:ebook_chapters(*)')
        .eq('ebook_id', ebookId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdo: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddModule() {
    try {
      const title = prompt("Título do novo módulo:");
      if (!title) return;

      const { error } = await supabase
        .from('ebook_modules')
        .insert({
          ebook_id: ebookId,
          title,
          order_index: modules.length
        });

      if (error) throw error;
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleAddChapter(moduleId: string) {
    try {
      const title = prompt("Título do novo capítulo:");
      if (!title) return;

      const module = modules.find(m => m.id === moduleId);
      const orderIndex = module.chapters?.length || 0;

      const { error } = await supabase
        .from('ebook_chapters')
        .insert({
          ebook_id: ebookId,
          module_id: moduleId,
          title,
          order_index: orderIndex,
          content: "<p>Comece a escrever aqui...</p>"
        });

      if (error) throw error;
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleSaveChapter() {
    if (!editingChapter) return;
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('ebook_chapters')
        .update({
          title: editingChapter.title,
          content: editingChapter.content,
          video_url: editingChapter.video_url,
          reading_minutes: editingChapter.reading_minutes,
          order_index: editingChapter.order_index
        })
        .eq('id', editingChapter.id);

      if (error) throw error;
      toast.success("Capítulo salvo!");
      setEditingChapter(null);
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Tem certeza que deseja excluir este capítulo?")) return;
    try {
      const { error } = await supabase
        .from('ebook_chapters')
        .delete()
        .eq('id', chapterId);
      if (error) throw error;
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm("Isso excluirá o módulo e todos os seus capítulos. Continuar?")) return;
    try {
      const { error } = await supabase
        .from('ebook_modules')
        .delete()
        .eq('id', moduleId);
      if (error) throw error;
      fetchContent();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const result = await importEbookFromFile({
            data: {
              ebook_id: ebookId,
              file_base64: base64,
              file_name: file.name,
              mime_type: file.type
            }
          });
          toast.success(`Arquivo importado com sucesso! ${result.chapters_count} capítulos criados em ${(result.duration_ms / 1000).toFixed(1)}s.`);
          fetchContent();
        } catch (err: any) {
          console.error("File Import Failure:", err);
          const errorMessage = err.message || "Erro desconhecido";
          
          if (errorMessage.includes("LIMITE_EXCEDIDO")) {
             toast.error("O arquivo é muito grande para ser processado automaticamente (limite de 60MB). Por favor, divida o arquivo em partes menores.", {
               duration: 8000
             });
          } else if (errorMessage.includes("TIMEOUT_PDF_INFRA") || errorMessage.includes("demorou muito")) {
             toast.error("Processamento Interrompido: O arquivo é muito complexo (contém muitas imagens ou tabelas). Tente remover elementos pesados ou dividir o arquivo.", {
               duration: 8000
             });
          } else if (errorMessage.includes("DOCX_INFRA_ERROR")) {
             toast.error("Erro no Processamento do Word: O documento é muito complexo para o conversor. Tente salvar como PDF ou simplificar a formatação.", {
               duration: 8000
             });
          } else if (errorMessage.includes("página de erro técnica") || 
              errorMessage.includes("instabilidade na infraestrutura") || 
              errorMessage.includes("This page didn't load") ||
              errorMessage.includes("INFRA_ERROR_HTML")) {
             toast.error("Instabilidade no Processamento: O servidor encontrou uma dificuldade com a densidade deste arquivo. Se o arquivo for pequeno (menos de 30 páginas), tente simplificar o conteúdo (remover imagens pesadas) ou converter o formato. Se for grande, divida-o em partes menores.", {
               duration: 10000
             });
          } else {
             toast.error("Não foi possível importar o arquivo: " + errorMessage);
          }
        }


      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error("Erro na leitura do arquivo: " + error.message);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-h-[500px]">
      {/* Sidebar - Tree View */}
      <div className="space-y-4 border-r border-white/5 pr-6">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Estrutura de Conteúdo</h4>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleImportFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
              />
              <button className="p-1 hover:bg-white/5 rounded text-white/40 transition-colors" title="Importar PDF ou Word (.docx)">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              </button>
            </div>
            <button onClick={handleAddModule} className="p-1 hover:bg-white/5 rounded text-[#ff6a00] transition-colors" title="Adicionar Módulo">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module.id} className="space-y-1">
              <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-xs font-bold truncate">{module.title}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleAddChapter(module.id)} className="p-1 text-white/40 hover:text-white"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => handleDeleteModule(module.id)} className="p-1 text-white/40 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="pl-4 space-y-1">
                {module.chapters?.sort((a: any, b: any) => a.order_index - b.order_index).map((chapter: any) => (
                  <button
                    key={chapter.id}
                    onClick={() => setEditingChapter(chapter)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 rounded-md text-[11px] transition-all",
                      editingChapter?.id === chapter.id ? "bg-[#ff6a00]/10 text-[#ff6a00] font-bold" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="truncate">{chapter.title}</span>
                    <div className="flex items-center gap-2">
                      {chapter.video_url && <Play className="h-2.5 w-2.5" />}
                      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        {editingChapter ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h4 className="font-bold uppercase text-xs tracking-widest text-[#ff6a00]">Editando Capítulo</h4>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDeleteChapter(editingChapter.id)}
                  className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                >
                  Excluir
                </button>
                <button 
                  onClick={handleSaveChapter}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#ff6a00] text-black hover:bg-[#ff8c33] transition-all flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título do Capítulo</label>
                  <input 
                    value={editingChapter.title}
                    onChange={e => setEditingChapter({...editingChapter, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ordem</label>
                    <input 
                      type="number"
                      value={editingChapter.order_index}
                      onChange={e => setEditingChapter({...editingChapter, order_index: parseInt(e.target.value)})}
                      className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Min. Leitura</label>
                    <input 
                      type="number"
                      value={editingChapter.reading_minutes || 0}
                      onChange={e => setEditingChapter({...editingChapter, reading_minutes: parseInt(e.target.value)})}
                      className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <VideoUpload 
                    value={editingChapter.video_url || ""}
                    onChange={url => setEditingChapter({...editingChapter, video_url: url})}
                    label="Vídeo do Capítulo (YouTube/Direto)"
                    description="Insira uma URL de vídeo para exibir este vídeo de forma centralizada no capítulo."
                  />
                  
                  {editingChapter.video_url && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preview do Vídeo</label>
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5">
                        <iframe 
                          src={editingChapter.video_url.includes('youtube.com') 
                            ? editingChapter.video_url.replace('watch?v=', 'embed/') 
                            : editingChapter.video_url} 
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 h-full flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Conteúdo do Capítulo (HTML ou Markdown)</label>
                <textarea 
                  value={editingChapter.content || ""}
                  onChange={e => setEditingChapter({...editingChapter, content: e.target.value})}
                  placeholder="Escreva aqui o conteúdo do capítulo. Suporta HTML básico..."
                  className="flex-1 w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-mono outline-none focus:border-[#ff6a00] resize-none min-h-[400px]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-20">
            <Edit3 className="h-12 w-12 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Selecione um capítulo para editar</p>
          </div>
        )}
      </div>
    </div>
  );
}

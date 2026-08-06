import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Library, 
  BookOpen, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Loader2,
  X,
  Sparkles,
  Zap,
  LayoutGrid,
  FileText
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { supabase } from "@/integrations/supabase/client";
import { saveContent } from "@/lib/content-admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/conteudo")({
  head: () => ({ meta: [{ title: "Gestão de Conteúdo · Admin" }] }),
  component: ContentHubPage,
});

type ContentItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  price?: number | null;
  is_ai_generated: boolean;
  content_url?: string | null;
  type: 'course' | 'ebook';
};

function ContentHubPage() {
  const [courses, setCourses] = useState<ContentItem[]>([]);
  const [ebooks, setEbooks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'ebooks'>('courses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ContentItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [coursesRes, ebooksRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('ebooks').select('*').order('created_at', { ascending: false })
      ]);

      setCourses((coursesRes.data || []).map(i => ({ is_ai_generated: false, ...i, type: 'course' })) as ContentItem[]);
      setEbooks((ebooksRes.data || []).map(i => ({ is_ai_generated: false, ...i, type: 'ebook' })) as ContentItem[]);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.type) {
      toast.error("Título e tipo são obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      await saveContent({ data: editingItem as any });
      toast.success("Conteúdo salvo com sucesso!");
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, type: 'course' | 'ebook') {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const { error } = await supabase.from(type === 'course' ? 'courses' : 'ebooks').delete().eq('id', id);
      if (error) throw error;
      toast.success("Excluído com sucesso");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  const currentList = activeTab === 'courses' ? courses : ebooks;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Conteúdo"
        subtitle="Gerencie seus cursos e e-books manuais ou gerados por IA."
        action={
          <div className="flex gap-2">
            <Link to="/app/admin/ebook-ai" className="btn-secondary text-xs">
              <Sparkles className="h-4 w-4 text-primary" /> Gerador IA
            </Link>
            <button 
              onClick={() => { setEditingItem({ type: activeTab === 'courses' ? 'course' : 'ebook', is_ai_generated: false }); setIsModalOpen(true); }}
              className="btn-fire"
            >
              <Plus className="h-4 w-4" /> Novo Manual
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setActiveTab('courses')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition ${activeTab === 'courses' ? "border-b-2 border-primary text-white" : "text-white/40 hover:text-white"}`}
        >
          Cursos ({courses.length})
        </button>
        <button 
          onClick={() => setActiveTab('ebooks')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition ${activeTab === 'ebooks' ? "border-b-2 border-primary text-white" : "text-white/40 hover:text-white"}`}
        >
          E-books ({ebooks.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <LayoutGrid className="mb-4 h-12 w-12 text-white/10" />
          <h3 className="font-display text-lg font-bold">Nenhum item encontrado</h3>
          <p className="max-w-xs text-sm text-muted-foreground">Adicione seu primeiro conteúdo manual clicando no botão acima.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {currentList.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111] p-4 transition hover:border-primary/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${item.type === 'course' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {item.type === 'course' ? <Library className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-display text-base font-bold text-white">{item.title}</h3>
                      {item.is_ai_generated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-primary">
                          <Zap className="h-2 w-2 fill-current" /> IA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40 font-medium">
                      {item.price ? <span className="text-emerald-400">R$ {item.price.toFixed(2)}</span> : "Grátis"}
                      {item.subtitle && <span className="truncate max-w-[200px] italic">• {item.subtitle}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                    className="p-2 text-white hover:text-primary transition"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id, item.type)}
                    className="p-2 text-white hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl animate-in zoom-in-95 rounded-2xl border border-white/10 bg-[#0e0e0e] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                {editingItem?.id ? "Editar Conteúdo" : `Novo ${editingItem?.type === 'course' ? 'Curso' : 'E-book'} Manual`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título</label>
                  <input
                    type="text"
                    required
                    value={editingItem?.title || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem?.price || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Subtítulo / Chamada Curta</label>
                <input
                  type="text"
                  value={editingItem?.subtitle || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-primary transition"
                  placeholder="Ex.: Aprenda a fazer a brasa perfeita em 10 minutos."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">URL do Conteúdo (PDF/Vídeo/Vimeo)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-white/20" />
                  <input
                    type="url"
                    value={editingItem?.content_url || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, content_url: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm outline-none focus:border-primary transition"
                    placeholder="https://suaplataforma.com/link-do-arquivo"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Descrição Completa</label>
                <textarea
                  value={editingItem?.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="h-24 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-primary transition"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="btn-fire flex-1 justify-center disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Conteúdo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Save, 
  X,
  PlayCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateChaptersForModules } from "@/lib/ebook-ai.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Chapter {
  id?: string;
  ebook_id: string;
  module_id: string | null;
  title: string;
  slug: string | null;
  content: string | null;
  video_url: string | null;
  order_index: number;
  reading_minutes: number | null;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface EbookChaptersEditorProps {
  ebookId: string;
}

export function EbookChaptersEditor({ ebookId }: EbookChaptersEditorProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<{ moduleId: string; moduleTitle: string; chapters: string[] }[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, string[]>>({});
  const [showAIModal, setShowAIModal] = useState(false);
  const [ebookTitle, setEbookTitle] = useState("");

  useEffect(() => {
    if (ebookId) {
      fetchEbookData();
      fetchModules();
      fetchChapters();
    }
  }, [ebookId]);

  async function fetchEbookData() {
    const { data } = await supabase.from("ebooks").select("title").eq("id", ebookId).single();
    if (data) setEbookTitle(data.title);
  }

  async function fetchModules() {
    try {
      const { data, error } = await supabase
        .from("ebook_modules")
        .select("*")
        .eq("ebook_id", ebookId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar módulos: " + error.message);
    }
  }

  async function fetchChapters() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ebook_chapters")
        .select("*")
        .eq("ebook_id", ebookId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      setChapters(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar capítulos: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChapter) return;

    try {
      setIsSaving(true);
      
      // Generate slug from title if missing
      const slug = editingChapter.slug || editingChapter.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const { error } = await supabase
        .from("ebook_chapters")
        .upsert({
          ...editingChapter,
          ebook_id: ebookId,
          slug,
          order_index: editingChapter.id ? editingChapter.order_index : chapters.length
        });

      if (error) throw error;
      
      toast.success("Capítulo salvo com sucesso!");
      setEditingChapter(null);
      fetchChapters();
    } catch (error: any) {
      toast.error("Erro ao salvar capítulo: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingModule) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ebook_modules")
        .upsert({
          ...editingModule,
          ebook_id: ebookId,
          order_index: editingModule.id ? editingModule.order_index : modules.length
        });

      if (error) throw error;
      
      toast.success("Módulo salvo com sucesso!");
      setEditingModule(null);
      fetchModules();
    } catch (error: any) {
      toast.error("Erro ao salvar módulo: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteModule(id: string) {
    if (!confirm("Tem certeza que deseja excluir este módulo? Todos os capítulos associados ficarão sem módulo.")) return;
    try {
      const { error } = await supabase.from("ebook_modules").delete().eq("id", id);
      if (error) throw error;
      toast.success("Módulo excluído");
      fetchModules();
      fetchChapters();
    } catch (error: any) {
      toast.error("Erro ao excluir módulo: " + error.message);
    }
  }

  async function handleDeleteChapter(id: string) {
    if (!confirm("Tem certeza que deseja excluir este capítulo?")) return;
    try {
      const { error } = await supabase.from("ebook_chapters").delete().eq("id", id);
      if (error) throw error;
      toast.success("Capítulo excluído");
      fetchChapters();
    } catch (error: any) {
      toast.error("Erro ao excluir capítulo: " + error.message);
    }
  }

  async function moveChapter(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= chapters.length) return;

    const newChapters = [...chapters];
    const [movedChapter] = newChapters.splice(index, 1);
    newChapters.splice(newIndex, 0, movedChapter);

    // Update order_index for all affected
    const updates = newChapters.map((ch, idx) => ({
      ...ch,
      order_index: idx
    }));

    setChapters(newChapters);

    try {
      const { error } = await supabase.from("ebook_chapters").upsert(updates);
      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao reordenar: " + error.message);
      fetchChapters(); // Revert
    }
  }

  async function handleAIGenerate() {
    if (modules.length === 0) {
      toast.error("Crie pelo menos um módulo antes de gerar capítulos.");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await generateChaptersForModules({ 
        data: { 
          ebookTitle: ebookTitle || "Ebook de Gastronomia", 
          modules: modules.map(m => ({ id: m.id, title: m.title })) 
        } 
      });

      if (res && res.suggestions) {
        setSuggestions(res.suggestions);
        const initialSelected: Record<string, string[]> = {};
        res.suggestions.forEach(s => {
          initialSelected[s.moduleId] = [...s.chapters];
        });
        setSelectedChapters(initialSelected);
        setShowAIModal(true);
      }
    } catch (error: any) {
      toast.error("Erro na IA: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleImportChapters() {
    try {
      setIsSaving(true);
      const chaptersToInsert = [];
      let baseOrder = chapters.length;

      for (const moduleId in selectedChapters) {
        const titles = selectedChapters[moduleId];
        for (const title of titles) {
          const slug = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

          chaptersToInsert.push({
            ebook_id: ebookId,
            module_id: moduleId,
            title,
            slug,
            content: `## ${title}\n\nConteúdo sugerido para este capítulo em breve...`,
            order_index: baseOrder++,
            reading_minutes: 5
          });
        }
      }

      if (chaptersToInsert.length === 0) {
        toast.error("Selecione pelo menos um capítulo.");
        return;
      }

      const { error } = await supabase.from("ebook_chapters").insert(chaptersToInsert);
      if (error) throw error;

      toast.success(`${chaptersToInsert.length} capítulos importados com sucesso!`);
      setShowAIModal(false);
      fetchChapters();
    } catch (error: any) {
      toast.error("Erro ao importar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  const toggleChapterSelection = (moduleId: string, chapter: string) => {
    setSelectedChapters(prev => {
      const current = prev[moduleId] || [];
      const updated = current.includes(chapter)
        ? current.filter(c => c !== chapter)
        : [...current, chapter];
      return { ...prev, [moduleId]: updated };
    });
  };

  if (loading) return <div className="p-8 text-center"><span className="animate-pulse text-white/40">Carregando capítulos...</span></div>;

  return (
    <div className="space-y-8">
      {/* Gestão de Módulos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h4 className="font-bold text-sm uppercase tracking-widest text-[#ff6a00]">Módulos</h4>
          {!editingModule && (
            <button 
              type="button"
              onClick={() => setEditingModule({ id: "", title: "", order_index: modules.length })}
              className="flex items-center gap-2 text-xs font-bold bg-[#ff6a00]/10 text-[#ff6a00] px-3 py-1.5 rounded-lg hover:bg-[#ff6a00]/20 transition"
            >
              <Plus className="h-4 w-4" /> Novo Módulo
            </button>
          )}
        </div>

        {editingModule ? (
          <form onSubmit={handleSaveModule} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-white">{editingModule.id ? "Editar Módulo" : "Novo Módulo"}</h5>
              <button type="button" onClick={() => setEditingModule(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título do Módulo</label>
              <input 
                required 
                value={editingModule.title} 
                onChange={e => setEditingModule({...editingModule, title: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isSaving} className="flex-1 bg-[#ff6a00] text-black font-bold py-2 rounded-lg disabled:opacity-50">
                {isSaving ? "Salvando..." : "Salvar Módulo"}
              </button>
              <button type="button" onClick={() => setEditingModule(null)} className="px-4 rounded-lg bg-white/5 font-bold">Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="grid gap-2">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                <span className="font-bold text-sm">{module.title}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingModule(module)} className="p-2 text-white/40 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => handleDeleteModule(module.id)} className="p-2 text-white/40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Gestão de Capítulos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h4 className="font-bold text-sm uppercase tracking-widest text-[#ff6a00]">Capítulos</h4>
          <div className="flex items-center gap-2">
            {!editingChapter && (
              <>
                <button 
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || modules.length === 0}
                  className="flex items-center gap-2 text-xs font-bold bg-fire/10 text-fire px-3 py-1.5 rounded-lg hover:bg-fire/20 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  IA: Sugerir Capítulos
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingChapter({ ebook_id: ebookId, module_id: modules[0]?.id || null, title: "", slug: "", content: "", video_url: "", order_index: chapters.length, reading_minutes: 5 })}
                  className="flex items-center gap-2 text-xs font-bold bg-[#ff6a00]/10 text-[#ff6a00] px-3 py-1.5 rounded-lg hover:bg-[#ff6a00]/20 transition"
                >
                  <Plus className="h-4 w-4" /> Novo Capítulo
                </button>
              </>
            )}
          </div>
        </div>

        {editingChapter ? (
          <form onSubmit={handleSaveChapter} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-white">{editingChapter.id ? "Editar Capítulo" : "Novo Capítulo"}</h5>
              <button type="button" onClick={() => setEditingChapter(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título do Capítulo</label>
                  <input 
                    required 
                    value={editingChapter.title} 
                    onChange={e => setEditingChapter({...editingChapter, title: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Módulo</label>
                  <select 
                    value={editingChapter.module_id || ""} 
                    onChange={e => setEditingChapter({...editingChapter, module_id: e.target.value || null})}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] appearance-none"
                  >
                    <option value="">Sem Módulo</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <PlayCircle className="h-3 w-3" /> URL do Vídeo (Opcional)
                  </label>
                  <input 
                    value={editingChapter.video_url || ""} 
                    onChange={e => setEditingChapter({...editingChapter, video_url: e.target.value})}
                    placeholder="https://youtube.com/embed/..."
                    className="w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Tempo de Leitura (min)
                  </label>
                  <input 
                    type="number"
                    value={editingChapter.reading_minutes || ""} 
                    onChange={e => setEditingChapter({...editingChapter, reading_minutes: parseInt(e.target.value)})}
                    className="w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Conteúdo do Capítulo (Markdown)</label>
                <textarea 
                  rows={8}
                  value={editingChapter.content || ""} 
                  onChange={e => setEditingChapter({...editingChapter, content: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-[#ff6a00] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" /> : <Save className="h-4 w-4" />}
                Salvar Capítulo
              </button>
              <button 
                type="button" 
                onClick={() => setEditingChapter(null)}
                className="px-6 rounded-lg bg-white/5 font-bold hover:bg-white/10 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            {chapters.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-white/20 text-sm">Nenhum capítulo cadastrado ainda.</p>
              </div>
            ) : (
              chapters.map((chapter, idx) => (
                <div 
                  key={chapter.id} 
                  className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <button 
                      disabled={idx === 0} 
                      onClick={() => moveChapter(idx, 'up')}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-0 transition text-white/40 hover:text-white"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button 
                      disabled={idx === chapters.length - 1} 
                      onClick={() => moveChapter(idx, 'down')}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-0 transition text-white/40 hover:text-white"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <h6 className="font-bold text-sm text-white">{chapter.title}</h6>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black uppercase text-white/40">
                        {modules.find(m => m.id === chapter.module_id)?.title || "Sem Módulo"}
                      </span>
                      {chapter.video_url && <span className="text-[9px] font-black uppercase text-[#ff6a00] bg-[#ff6a00]/10 px-1.5 py-0.5 rounded">Vídeo</span>}
                      {chapter.reading_minutes && <span className="text-[9px] font-black uppercase text-white/40">{chapter.reading_minutes} min leitura</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingChapter(chapter)} 
                      className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => chapter.id && handleDeleteChapter(chapter.id)} 
                      className="p-2 rounded-lg text-white/40 hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Modal de Sugestões da IA */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-fire">
              <Sparkles className="h-5 w-5" /> Sugestões de Capítulos com IA
            </DialogTitle>
            <DialogDescription className="text-white/60">
              A IA sugeriu capítulos baseados nos módulos do ebook <strong>{ebookTitle}</strong>. Selecione os que deseja importar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.moduleId} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-fire/10 text-fire border-fire/20 font-bold uppercase tracking-widest text-[10px]">
                    Módulo
                  </Badge>
                  <h5 className="font-bold text-sm text-white/90">{suggestion.moduleTitle}</h5>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                  {suggestion.chapters.map((chapterTitle, cIdx) => (
                    <div 
                      key={cIdx} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        selectedChapters[suggestion.moduleId]?.includes(chapterTitle)
                          ? "bg-fire/5 border-fire/30"
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                      onClick={() => toggleChapterSelection(suggestion.moduleId, chapterTitle)}
                    >
                      <Checkbox 
                        id={`ch-${suggestion.moduleId}-${cIdx}`}
                        checked={selectedChapters[suggestion.moduleId]?.includes(chapterTitle)}
                        onCheckedChange={() => toggleChapterSelection(suggestion.moduleId, chapterTitle)}
                        className="mt-0.5 border-fire/50 data-[state=checked]:bg-fire data-[state=checked]:text-black"
                      />
                      <label 
                        htmlFor={`ch-${suggestion.moduleId}-${cIdx}`}
                        className="text-sm font-medium leading-tight cursor-pointer"
                      >
                        {chapterTitle}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 border-t border-white/10">
            <button
              onClick={() => setShowAIModal(false)}
              className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleImportChapters}
              disabled={isSaving}
              className="btn-fire flex items-center gap-2 min-w-[160px] justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Importar Selecionados
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

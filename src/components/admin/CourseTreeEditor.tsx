import { useState, useEffect } from "react";
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
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VideoUpload } from "./VideoUpload";
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

interface Lesson {
  id?: string;
  module_id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  content: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  order_index: number;
}

interface CourseTreeEditorProps {
  courseId: string;
}

export function CourseTreeEditor({ courseId }: CourseTreeEditorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Debug: Monitorar estados de edição
  useEffect(() => {
    if (editingModule) console.log("CourseTreeEditor: editingModule set", editingModule);
  }, [editingModule]);

  useEffect(() => {
    if (editingLesson) console.log("CourseTreeEditor: editingLesson set", editingLesson);
  }, [editingLesson]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: mods, error: modError } = await supabase
        .from("course_modules" as any)
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modError) throw modError;

      const modIds = (mods as any[])?.map(m => m.id) || [];
      
      let less: any[] = [];
      if (modIds.length > 0) {
        const { data: lessData, error: lesError } = await supabase
          .from("course_lessons" as any)
          .select("*")
          .in("module_id", modIds)
          .order("order_index");
        if (lesError) throw lesError;
        less = lessData || [];
      }

      setModules((mods as any[])?.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        video_url: m.video_url,
        order_index: m.order_index || 0
      })) || []);

      setLessons(less.map(l => ({
        id: l.id,
        module_id: l.module_id,
        title: l.title,
        slug: l.slug,
        description: l.description,
        video_url: l.video_url,
        duration_minutes: l.duration_minutes || 0,
        order_index: l.order_index || 0,
        is_free: l.is_free || false,
        content: l.content
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdo: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingModule) return;
    try {
      setIsSaving(true);
      
      const payload = { 
        id: editingModule.id,
        title: editingModule.title,
        description: editingModule.description,
        video_url: editingModule.video_url,
        order_index: editingModule.order_index,
        course_id: courseId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("course_modules" as any)
        .upsert(payload);

      if (error) {
        // Se falhou por RLS ou outro erro do Supabase, tentamos via Server Function
        console.warn("Retrying module save via Server Function due to:", error.message);
        const { upsertModule } = await import("@/lib/courses.functions");
        await upsertModule({ data: payload });
      }
      
      toast.success("Módulo salvo!");
      setEditingModule(null);
      fetchData();
    } catch (error: any) {
      console.error("Error in handleSaveModule:", error);
      toast.error("Erro ao salvar módulo: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLesson) return;
    try {
      setIsSaving(true);
      const slug = editingLesson.slug || editingLesson.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      
      const payload = { 
        ...editingLesson, 
        slug,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("course_lessons" as any)
        .upsert(payload);

      if (error) {
        console.warn("Retrying lesson save via Server Function due to:", error.message);
        const { upsertLesson } = await import("@/lib/courses.functions");
        await upsertLesson({ data: payload });
      }
      
      toast.success("Aula salva!");
      setEditingLesson(null);
      fetchData();
    } catch (error: any) {
      console.error("Error in handleSaveLesson:", error);
      toast.error("Erro ao salvar aula: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(table: string, id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Excluído com sucesso");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  }

  if (loading) return <div className="p-8 text-center text-white/40">Carregando estrutura...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Conteúdo do Curso</h3>
        <button 
          onClick={() => {
            const newId = crypto.randomUUID();
            console.log("Generating new module with ID:", newId);
            setEditingModule({ 
              id: newId, 
              title: "", 
              description: "", 
              video_url: "", 
              order_index: modules.length 
            });
          }}
          className="flex items-center gap-2 bg-[#ff6a00] px-4 py-2 rounded-lg text-xs font-bold text-black hover:bg-[#ff8c33] transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar Módulo
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="bg-white/[0.02] rounded-xl overflow-hidden border border-white/5">
            <div className="p-4 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-white/20 cursor-move" />
                <h4 className="font-bold">{module.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingLesson({ module_id: module.id, title: "", slug: "", description: "", video_url: "", duration_minutes: 10, order_index: lessons.filter(l => l.module_id === module.id).length, is_free: false, content: "" })}
                  className="p-2 text-white/40 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingModule(module)} className="p-2 text-white/40 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete('course_modules', module.id, module.title)} className="p-2 text-white/40 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="p-2 space-y-1">
              {lessons.filter(l => l.module_id === module.id).map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] group transition-colors">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="h-4 w-4 text-white/20" />
                    <span className="text-sm">{lesson.title}</span>
                    {lesson.is_free && <Badge className="bg-green-500/10 text-green-500 border-none text-[8px]">Grátis</Badge>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingLesson(lesson)} className="p-1.5 text-white/40 hover:text-white"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete('course_lessons', lesson.id!, lesson.title)} className="p-1.5 text-white/40 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingModule && (
        <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)} modal={false}>
          <DialogContent className="bg-[#0e0e0e] border-white/10 text-white z-[70] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
            <DialogHeader><DialogTitle>Módulo</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveModule} className="space-y-4 pt-4 text-left">
              <input 
                required 
                placeholder="Título do Módulo"
                value={editingModule.title} 
                onChange={e => setEditingModule({...editingModule, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-3 rounded-lg outline-none focus:border-[#ff6a00]" 
              />
              <div className="space-y-1">
                <VideoUpload 
                  value={editingModule.video_url || ""} 
                  onChange={url => setEditingModule({...editingModule, video_url: url})}
                  bucket="course-assets"
                  label="Vídeo de Demonstração do Módulo"
                />
              </div>
              <textarea 
                placeholder="Descrição (opcional)"
                value={editingModule.description || ""} 
                onChange={e => setEditingModule({...editingModule, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-3 rounded-lg outline-none focus:border-[#ff6a00] h-24" 
              />
              <DialogFooter>
                <button type="submit" disabled={isSaving} className="w-full py-3 rounded-lg bg-[#ff6a00] text-black font-bold disabled:opacity-50">{isSaving ? "Salvando..." : "Salvar"}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {editingLesson && (
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="bg-[#0e0e0e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto text-left">
            <DialogHeader><DialogTitle>Aula</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveLesson} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Título</label>
                  <input required placeholder="Título" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <VideoUpload 
                    value={editingLesson.video_url || ""} 
                    onChange={url => setEditingLesson({...editingLesson, video_url: url})}
                    bucket="course-assets"
                    label="Vídeo da Aula"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Descrição Curta</label>
                <textarea placeholder="Descrição" value={editingLesson.description || ""} onChange={e => setEditingLesson({...editingLesson, description: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg h-24 outline-none resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Conteúdo da Aula (Markdown)</label>
                <textarea placeholder="Conteúdo (Markdown/Rich Text)" value={editingLesson.content || ""} onChange={e => setEditingLesson({...editingLesson, content: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-lg h-40 outline-none resize-none" />
              </div>
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Duração (min)</label>
                  <input type="number" value={editingLesson.duration_minutes} onChange={e => setEditingLesson({...editingLesson, duration_minutes: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 p-3 rounded-lg w-32 outline-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <Checkbox checked={editingLesson.is_free} onCheckedChange={(val) => setEditingLesson({...editingLesson, is_free: !!val})} />
                  <span className="text-sm">Aula Grátis (Preview)</span>
                </label>
              </div>
              <DialogFooter>
                <button type="submit" disabled={isSaving} className="w-full py-3 rounded-lg bg-[#ff6a00] text-black font-bold disabled:opacity-50">{isSaving ? "Salvando..." : "Salvar"}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

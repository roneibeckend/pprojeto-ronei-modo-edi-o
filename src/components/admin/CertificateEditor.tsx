import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Loader2,
  Award,
  Settings2,
  FileText,
  Save,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { 
  getContentCertificate, 
  saveContentCertificate, 
  listTemplates,
  generateCertificateManually 
} from "@/lib/certificates.functions";
import { cn } from "@/lib/utils";

interface CertificateEditorProps {
  contentId: string;
  contentType: 'course' | 'ebook';
}

export function CertificateEditor({ contentId, contentType }: CertificateEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [manualStudentId, setManualStudentId] = useState("");
  const [generating, setGenerating] = useState(false);

  const getCertFn = useServerFn(getContentCertificate);
  const saveCertFn = useServerFn(saveContentCertificate);
  const listTemplatesFn = useServerFn(listTemplates);
  const generateManuallyFn = useServerFn(generateCertificateManually);

  useEffect(() => {
    fetchData();
  }, [contentId]);

  async function fetchData() {
    try {
      setLoading(true);
      const [certConfig, templatesList] = await Promise.all([
        getCertFn({ data: { contentId } }),
        listTemplatesFn()
      ]);
      setConfig(certConfig);
      setTemplates(templatesList);
    } catch (error: any) {
      toast.error("Erro ao carregar configurações de certificado: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await saveCertFn({
        data: {
          content_id: contentId,
          template_id: config.template_id || (templates.length > 0 ? templates[0].id : null),
          is_enabled: !!config.is_enabled,
          custom_text: config.custom_text || null,
          min_progress_percentage: config.min_progress_percentage ?? 100

        }
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleManualGenerate() {
    if (!manualStudentId) {
      toast.error("Informe o ID do aluno.");
      return;
    }

    try {
      setGenerating(true);
      await generateManuallyFn({
        data: {
          student_id: manualStudentId,
          content_id: contentId,
          content_type: contentType
        }
      });
      toast.success("Certificado gerado com sucesso!");
      setManualStudentId("");
    } catch (error: any) {
      toast.error("Erro ao gerar: " + error.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
          <h4 className="font-bold flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-[#ff6a00]" /> Configurações de Emissão
          </h4>

          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
            <div className="space-y-0.5">
              <div className="text-sm font-bold">Habilitar Certificado</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Emitir automaticamente após conclusão</div>
            </div>
            <button 
              onClick={() => setConfig({ ...config, is_enabled: !config.is_enabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                config?.is_enabled ? "bg-[#ff6a00]" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-black transition-all",
                config?.is_enabled ? "left-7" : "left-1"
              )} />
            </button>

          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Template de Certificado</label>
            <select 
              value={config.template_id || (templates.length > 0 ? templates[0].id : "")} 
              onChange={e => setConfig({ ...config, template_id: e.target.value })}
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] appearance-none"
            >
              <option value="">Selecione um template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Progresso Mínimo para Emissão (%)</label>
            <input 
              type="number"
              min="0"
              max="100"
              value={config.min_progress_percentage ?? 100}
              onChange={e => setConfig({ ...config, min_progress_percentage: parseInt(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Texto Customizado (Opcional)</label>
            <textarea 
              rows={3}
              value={config.custom_text || ""}
              onChange={e => setConfig({ ...config, custom_text: e.target.value })}
              placeholder="Ex: Carga horária total de 40 horas..."
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] resize-none"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#ff6a00] text-black font-bold flex items-center justify-center gap-2 hover:bg-[#ff8c33] disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </button>
        </div>

        {/* Manual Generation */}
        <div className="space-y-8">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-[#ff6a00]" /> Geração Manual
            </h4>
            <p className="text-xs text-white/40">Use para emitir o certificado para um aluno específico independente do progresso.</p>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">ID do Aluno (UUID)</label>
              <input 
                type="text"
                value={manualStudentId}
                onChange={e => setManualStudentId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
              />
            </div>

            <button 
              onClick={handleManualGenerate}
              disabled={generating}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 disabled:opacity-50 transition-all"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
              Gerar Certificado Agora
            </button>
          </div>

          {/* Preview Placeholder */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center py-12 text-white/20">
            <FileText className="h-12 w-12 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Visualização do Template</p>
            <p className="text-[10px] mt-2 italic">A visualização em tempo real do template será implementada em breve.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

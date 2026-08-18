import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Loader2,
  Award,
  Settings2,
  FileText,
  Save,
  UserPlus,
  Upload,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { 
  getContentCertificate, 
  saveContentCertificate, 
  listTemplates,
  generateCertificateManually,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from "@/lib/certificates.functions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  const [uploading, setUploading] = useState(false);

  const getCertFn = useServerFn(getContentCertificate);
  const saveCertFn = useServerFn(saveContentCertificate);
  const listTemplatesFn = useServerFn(listTemplates);
  const generateManuallyFn = useServerFn(generateCertificateManually);
  const createTemplateFn = useServerFn(createTemplate);
  const updateTemplateFn = useServerFn(updateTemplate);
  const deleteTemplateFn = useServerFn(deleteTemplate);

  useEffect(() => {
    if (contentId) {
      fetchData();
    }
  }, [contentId]);

  async function fetchData() {
    if (!contentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [certConfig, templatesList] = await Promise.all([
        getCertFn({ data: { contentId } }),
        listTemplatesFn()
      ]);
      setConfig(certConfig);
      setTemplates((templatesList as any[]) || []);
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
          content_type: contentType,
          template_id: config?.template_id || (templates.length > 0 ? templates[0].id : null),
          is_enabled: !!config?.is_enabled,
          custom_text: config?.custom_text || null,
          min_progress_percentage: config?.min_progress_percentage ?? 100,
          city_of_issue: config?.city_of_issue || 'Goiânia - Goiás'
        }
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem (PNG, JPG).");
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `certificates/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-covers')
        .getPublicUrl(fileName);

      // Create a new template with this background
      const newTemplate = await createTemplateFn({
        data: {
          name: `Personalizado - ${file.name}`,
          background_url: publicUrl,
          is_default: false
        }
      });

      const templateData = newTemplate as any;
      setTemplates([templateData, ...templates]);
      setConfig({ ...config, template_id: templateData.id });
      toast.success("Novo modelo carregado e selecionado!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
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

  const selectedTemplate = templates.find(t => t.id === config?.template_id);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
    </div>
  );

  if (!config) return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
      <Settings2 className="h-12 w-12 mb-4 opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest">Configuração não encontrada</p>
      <p className="text-xs mt-2">Salve as informações básicas do e-book/curso primeiro ou tente recarregar.</p>
      <button 
        onClick={fetchData}
        className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
      >
        Tentar Novamente
      </button>
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
              onClick={() => setConfig({ ...config, is_enabled: !config?.is_enabled })}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Modelo do Certificado</label>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#ff6a00] cursor-pointer hover:opacity-80 transition-opacity">
                <Upload className="h-3 w-3" />
                <span>Upload Novo Layout</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <select 
                value={config?.template_id || ""} 
                onChange={e => setConfig({ ...config, template_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] appearance-none"
              >
                <option value="">Selecione um template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_default ? '(Padrão)' : ''}
                  </option>
                ))}
              </select>

              {config?.template_id && !selectedTemplate?.is_default && (
                <button 
                  onClick={() => {
                    const defaultTemplate = templates.find(t => t.is_default);
                    if (defaultTemplate) setConfig({ ...config, template_id: defaultTemplate.id });
                    toast.info("Restaurado para o modelo padrão (clique em salvar para aplicar).");
                  }}
                  className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors py-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Voltar para o modelo anterior/padrão
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Progresso Mínimo para Emissão (%)</label>
            <input 
              type="number"
              min="0"
              max="100"
              value={config?.min_progress_percentage ?? 100}
              onChange={e => setConfig({ ...config, min_progress_percentage: parseInt(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Texto Customizado (Opcional)</label>
            <textarea 
              rows={3}
              value={config?.custom_text || ""}
              onChange={e => setConfig({ ...config, custom_text: e.target.value })}
              placeholder="Ex: Carga horária total de 40 horas..."
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Cidade de Emissão</label>
            <select 
              value={config?.city_of_issue || 'Goiânia - Goiás'}
              onChange={e => setConfig({ ...config, city_of_issue: e.target.value })}
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] appearance-none"
            >
              <option value="Goiânia - Goiás">Goiânia - Goiás</option>
              <option value="Senador Canedo - Goiás">Senador Canedo - Goiás</option>
            </select>
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

        {/* Preview & Manual */}
        <div className="space-y-8">
          {/* Preview Section */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">
            {selectedTemplate?.background_url ? (
              <>
                <img 
                  src={selectedTemplate.background_url} 
                  alt="Template Preview" 
                  className="absolute inset-0 w-full h-full object-contain opacity-50 group-hover:opacity-80 transition-opacity"
                />
                <div className="relative z-10 flex flex-col items-center text-center p-4 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 max-w-[80%]">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-[#ff6a00]" />
                  <p className="text-sm font-bold">{selectedTemplate.name}</p>
                  <p className="text-[10px] text-white/60 mt-1 uppercase tracking-tighter">Layout Selecionado</p>
                </div>
              </>
            ) : (
              <div className="text-center text-white/20">
                <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Visualização do Template</p>
                <p className="text-[10px] mt-2 italic">Selecione ou carregue um modelo para visualizar</p>
              </div>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
}

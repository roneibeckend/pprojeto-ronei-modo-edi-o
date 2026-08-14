import { useState } from "react";
import { Plus, Loader2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  label?: string;
  description?: string;
}

export function VideoUpload({ 
  value, 
  onChange, 
  bucket = "course-assets", 
  label = "Vídeo da Aula",
  description = "Formatos aceitos: MP4, MOV. Tamanho máx: 100MB."
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("O vídeo deve ter no máximo 100MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith('video/')) {
      toast.error("Por favor, selecione um arquivo de vídeo");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type || undefined
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Vídeo enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload do vídeo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</label>
      <div className="flex gap-2">
        <input 
          value={value || ""} 
          onChange={e => onChange(e.target.value)} 
          placeholder="URL do vídeo (ou faça upload...)" 
          className="flex-1 bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
        />
        <label className="flex items-center justify-center px-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition group min-w-[50px]">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#ff6a00]" />
          ) : (
            <>
              <Video className="h-4 w-4 text-white/40 group-hover:text-white transition" />
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={handleUpload}
                disabled={isUploading}
              />
            </>
          )}
        </label>
      </div>
      <p className="text-[9px] text-white/30 italic">{description}</p>
    </div>
  );
}

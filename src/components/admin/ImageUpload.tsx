import { useState } from "react";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  label?: string;
  description?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket = "content-covers", 
  label = "Imagem de Capa",
  description = "Formatos aceitos: JPG, PNG. Tamanho máx: 5MB."
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '31536000' });

      if (uploadError) throw uploadError;

      // O bucket é privado: geramos um link assinado de longa duração para
      // que a imagem fique visível para os alunos (o /object/public/ falharia).
      const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, TEN_YEARS);

      const finalUrl =
        signed?.signedUrl ||
        supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;

      onChange(finalUrl);
      toast.success("Imagem enviada com sucesso!");

    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
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
          placeholder="https://..." 
          className="flex-1 bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00]" 
        />
        <label className="flex items-center justify-center px-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition group min-w-[50px]">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#ff6a00]" />
          ) : (
            <>
              <Plus className="h-4 w-4 text-white/40 group-hover:text-white transition" />
              <input 
                type="file" 
                accept="image/*" 
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

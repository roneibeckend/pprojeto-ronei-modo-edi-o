import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoverImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** URL real vinda do banco/Storage. Vazio/nulo mostra o fallback neutro. */
  src?: string | null;
  /** Rótulo acessível/visual do conteúdo. */
  alt: string;
}

/**
 * Imagem de capa com fallback NEUTRO.
 *
 * Não usamos imagens demonstrativas como fallback: quando não existe imagem
 * cadastrada (ou o arquivo falha ao carregar) mostramos um bloco neutro,
 * deixando claro que o conteúdo visual ainda não foi cadastrado.
 */
export function CoverImage({ src, alt, className, ...props }: CoverImageProps) {
  const [failed, setFailed] = useState(false);
  const hasSrc = typeof src === "string" && src.trim().length > 0;

  if (!hasSrc || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — sem imagem cadastrada`}
        className={cn(
          "grid h-full w-full place-items-center bg-secondary/60 text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="h-6 w-6 opacity-50" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src as string}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
      {...props}
    />
  );
}

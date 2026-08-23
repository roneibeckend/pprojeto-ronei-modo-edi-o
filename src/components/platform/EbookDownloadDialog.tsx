import { useState } from "react";
import { X, ShieldAlert, Loader2, Download } from "lucide-react";

interface EbookDownloadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  ebookTitle: string;
  owner: { name: string; email: string } | null;
}

export default function EbookDownloadDialog({
  open,
  onClose,
  onConfirm,
  ebookTitle,
  owner,
}: EbookDownloadDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    if (!accepted) return;
    try {
      setLoading(true);
      await onConfirm();
      setAccepted(false);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/90 p-4 py-8 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e0e] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#ff6a00]/10 p-2.5 text-[#ff6a00]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Aviso de Direitos Autorais</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Download protegido
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-white/5" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-left text-xs leading-relaxed text-white/60">
          <p>
            Você está baixando <span className="font-bold text-white">{ebookTitle}</span>. Este material é
            protegido pela Lei 9.610/98 (Direitos Autorais).
          </p>
          <ul className="space-y-2 rounded-xl border border-white/5 bg-black/40 p-4">
            <li>• É <span className="font-bold text-white">proibida a revenda</span> deste material, total ou parcial.</li>
            <li>• É proibido compartilhar, redistribuir ou publicar o arquivo em grupos, redes sociais ou sites.</li>
            <li>• É proibido qualquer uso comercial sem autorização expressa e por escrito do autor.</li>
            <li>• O uso é <span className="font-bold text-white">pessoal e intransferível</span>.</li>
          </ul>
          <div className="rounded-xl border border-[#ff6a00]/20 bg-[#ff6a00]/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00]">
              Cópia identificada
            </p>
            <p className="mt-2 text-white/70">
              Todas as páginas do PDF serão marcadas com seus dados:
            </p>
            <p className="mt-1 font-mono text-[11px] text-white">
              {owner?.name || "—"} · {owner?.email || "—"}
            </p>
            <p className="mt-2 text-white/50">
              Em caso de distribuição irregular, a cópia poderá ser rastreada até a sua conta, com
              responsabilização civil e criminal.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#ff6a00]"
            />
            <span className="text-white/70">
              Declaro que li e concordo com os termos acima e que o uso para venda ou distribuição é
              proibido.
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!accepted || loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#ff6a00] py-3 text-[10px] font-bold uppercase tracking-widest text-black transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {loading ? "Gerando PDF..." : "Aceitar e baixar"}
          </button>
        </div>
      </div>
    </div>
  );
}

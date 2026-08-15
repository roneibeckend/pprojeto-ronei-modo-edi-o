import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Sparkles, X, Smartphone, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaInstallBanner() {
  const { isVisible, installPwa, dismissPrompt } = usePwaInstall();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:w-80"
        >
          <div className="glass overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
            <div className="bg-primary/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">
                      Leve seus conteúdos com você
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Instale nosso app e acesse seus cursos e e-books diretamente pela tela inicial.
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismissPrompt}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  <span>Experiência otimizada para celular</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={installPwa}
                    className="btn-fire flex-1 py-2 text-xs font-bold uppercase tracking-wider"
                  >
                    Instalar app
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/10"
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

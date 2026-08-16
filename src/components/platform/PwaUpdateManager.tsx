import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function PwaUpdateManager() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });
    }
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-safe left-4 right-4 z-[100] animate-in slide-in-from-bottom-4">
      <div className="glass flex items-center justify-between gap-4 rounded-xl p-4 shadow-fire">
        <div className="text-sm font-medium">Nova versão disponível!</div>
        <button
          onClick={() => window.location.reload()}
          className="btn-fire flex items-center gap-2 px-4 py-2 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Atualizar agora
        </button>
      </div>
    </div>
  );
}

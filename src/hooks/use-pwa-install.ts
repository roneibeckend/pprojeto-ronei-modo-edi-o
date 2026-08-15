import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone || 
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: any) => {
      // Previne o mini-infobar do Chrome no mobile
      e.preventDefault();
      // Guarda o evento para disparar depois
      setDeferredPrompt(e);
      
      // Verifica se o usuário já recusou recentemente
      const lastPrompt = localStorage.getItem('pwa-prompt-dismissed');
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      // Always show in development if not dismissed in the last 10 seconds
      const isDev = window.location.hostname === 'localhost';
      const waitTime = isDev ? 10000 : threeDays;

      if (!lastPrompt || (now - parseInt(lastPrompt)) > waitTime) {
        // Pequeno atraso para não aparecer imediatamente
        setTimeout(() => {
          console.log('Exibindo banner de instalação PWA');
          setIsVisible(true);
        }, 3000);
      } else {
        console.log('Banner PWA ignorado devido a dispensa recente');
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsStandalone(true);
      console.log('PWA instalado com sucesso');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      console.log('Usuário recusou a instalação');
      dismissPrompt();
    }
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  return {
    isVisible: isVisible && !isStandalone && !!deferredPrompt,
    isStandalone,
    installPwa,
    dismissPrompt,
    canInstall: !!deferredPrompt,
    deferredPrompt // Exportado para depuração se necessário
  };
}

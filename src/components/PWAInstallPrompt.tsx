import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Ne pas afficher immédiatement, attendre un peu
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 3000); // Afficher après 3s
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Pour iOS, afficher le prompt manuellement
    if (iOS && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installée');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(
      isIOS ? 'pwa-install-dismissed-ios' : 'pwa-install-dismissed',
      Date.now().toString()
    );
  };

  // Ne rien afficher si déjà installé ou prompt fermé
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-morphism rounded-2xl p-4 border border-purple-500/30 shadow-xl max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">
              Installer Jang
            </h3>
            <p className="text-white/70 text-sm mt-1">
              {isIOS
                ? "Ajoutez Jang à votre écran d'accueil pour un accès rapide"
                : "Installez l'app pour un accès hors ligne et plus rapide"
              }
            </p>

            {isIOS ? (
              <div className="mt-3 text-white/80 text-sm bg-white/5 rounded-lg p-3">
                <p className="flex items-center gap-2">
                  <span>1. Appuyez sur</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded">Partager</span>
                </p>
                <p className="mt-1">
                  2. Sélectionnez "Sur l'écran d'accueil"
                </p>
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Installer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

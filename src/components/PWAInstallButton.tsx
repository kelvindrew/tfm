/**
 * TFM SCHEDULER — Bouton d'Installation PWA & Support Hors-Ligne
 */

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return null;
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition"
      >
        <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span>Installer</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95 transition"
        >
          <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Installer</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18191D] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  Installer TFM Scheduler
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              <p className="text-[#71717A] dark:text-[#A1A1AA]">
                Pour utiliser TFM Scheduler en mode plein écran et hors-ligne :
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-[#18191D] dark:text-[#F4F4F5]">
                <li>Appuyez sur le bouton <strong>Partager</strong> dans Safari.</li>
                <li>Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong>.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-2 py-2 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] font-semibold hover:opacity-90 transition active:scale-95"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

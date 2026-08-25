'use client';

import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const initialTimer = window.setTimeout(() => {
      setIsStandalone(standalone);
      setIsIOS(ios);
    }, 0);

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
    }

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  if (isStandalone || (!installPrompt && !isIOS)) return null;

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
      return;
    }
    setShowIOSHelp(value => !value);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void install()}
        className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/20"
      >
        Cài ứng dụng
      </button>
      {showIOSHelp && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/10 bg-zinc-950 p-4 text-xs leading-5 text-zinc-300 shadow-2xl">
          Trên iPhone/iPad: nhấn <strong>Chia sẻ</strong>, sau đó chọn
          <strong> Thêm vào Màn hình chính</strong>.
        </div>
      )}
    </div>
  );
}

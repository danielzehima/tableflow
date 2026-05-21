"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Enregistrement du service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Déjà installé en mode standalone → ne rien montrer
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:left-64 lg:right-4">
      <div className="max-w-lg mx-auto bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-3 shadow-2xl border border-slate-700">
        <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-black text-lg">T</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">Installer TableFlow</p>
          <p className="text-slate-400 text-xs mt-0.5">Ajoutez l&apos;app à votre écran d&apos;accueil</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-white text-sm px-2 py-2 transition-colors"
            aria-label="Fermer"
          >
            Plus tard
          </button>
          <button
            onClick={install}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}

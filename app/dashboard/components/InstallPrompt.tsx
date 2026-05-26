"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "tableflow:install-prompt-seen";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    if (!isMobile) return;

    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    const alreadySeen = localStorage.getItem(STORAGE_KEY);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!alreadySeen) setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Sur iOS, pas d'événement beforeinstallprompt → on affiche les instructions manuelles
    if (ios && !alreadySeen) {
      setOpen(true);
    }

    const installed = () => {
      setOpen(false);
      setDeferred(null);
      localStorage.setItem(STORAGE_KEY, "installed");
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, "dismissed"); } catch {}
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } else {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    }
    setDeferred(null);
    setOpen(false);
  };

  if (isStandalone || !open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="TableFlow" className="w-12 h-12 rounded-xl" />
          <div>
            <h2 className="text-slate-900 font-bold text-lg leading-tight">Installer TableFlow</h2>
            <p className="text-slate-500 text-xs">Accédez à votre dashboard depuis votre écran d'accueil</p>
          </div>
        </div>

        <ul className="text-sm text-slate-600 space-y-2 mb-5">
          <li className="flex gap-2"><span className="text-orange-500">✓</span> Ouverture instantanée en plein écran</li>
          <li className="flex gap-2"><span className="text-orange-500">✓</span> Notifications de nouvelles commandes</li>
          <li className="flex gap-2"><span className="text-orange-500">✓</span> Fonctionne hors connexion (basique)</li>
        </ul>

        {isIOS && !deferred ? (
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-4">
            Sur iPhone : appuyez sur <span className="font-semibold">Partager</span> ⎋ puis <span className="font-semibold">« Sur l'écran d'accueil »</span> ➕
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
          >
            Plus tard
          </button>
          {deferred && (
            <button
              onClick={install}
              className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              Installer
            </button>
          )}
          {isIOS && !deferred && (
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              J'ai compris
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

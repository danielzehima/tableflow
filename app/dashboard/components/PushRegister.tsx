"use client";

import { useEffect, useState } from "react";

// Convertit la clé VAPID publique (base64url) en Uint8Array pour PushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Enregistre l'appareil aux notifications Web Push "plat prêt".
 * Affiche un petit bouton discret si la permission n'est pas encore accordée
 * (les navigateurs exigent un geste utilisateur pour demander la permission).
 */
export default function PushRegister() {
  const [needsPrompt, setNeedsPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Si la permission est déjà accordée → (ré)abonner silencieusement au montage
  useEffect(() => {
    if (!supported || !vapidKey) return;
    if (Notification.permission === "granted") {
      void subscribe();
    } else if (Notification.permission === "default") {
      setNeedsPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, vapidKey]);

  async function subscribe(): Promise<boolean> {
    if (!supported || !vapidKey) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleEnable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribe();
        setNeedsPrompt(false);
      } else if (perm === "denied") {
        setNeedsPrompt(false); // l'utilisateur a refusé — on n'insiste pas
      }
    } finally {
      setBusy(false);
    }
  }

  if (!supported || !vapidKey || !needsPrompt) return null;

  return (
    <button
      onClick={handleEnable}
      disabled={busy}
      title="Recevoir une alerte quand un plat est prêt, même app fermée"
      className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-50"
    >
      <span>🔔</span>
      <span>{busy ? "…" : "Activer les alertes"}</span>
    </button>
  );
}

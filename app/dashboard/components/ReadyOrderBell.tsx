"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "../../lib/supabase-client";

type ReadyNotif = {
  id: string;
  table_number: string;
  items: string;
  created_at: string;
  read: boolean;
};

type OrderRow = {
  id: string;
  table_number: string;
  items: string;
  status: string;
  created_at: string;
};

// Singleton AudioContext — iOS Safari requires it to be resumed after a user gesture
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_audioCtx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      _audioCtx = new Ctx();
    }
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

// Carillon ascendant distinct — signale "plat prêt à servir"
function playReadySound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    [784, 988, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {
    // Audio API indisponible
  }
}

export default function ReadyOrderBell({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<ReadyNotif[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const router = useRouter();

  // Débloque l'AudioContext au premier geste utilisateur (requis iOS Safari)
  useEffect(() => {
    const unlock = () => getAudioCtx();
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });
    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, []);

  const pushReady = useCallback((o: OrderRow, withAlert: boolean) => {
    if (seenIds.current.has(o.id)) return;
    seenIds.current.add(o.id);
    if (withAlert) playReadySound();
    setNotifs((prev) => [
      { id: o.id, table_number: o.table_number, items: o.items, created_at: o.created_at, read: !withAlert },
      ...prev,
    ].slice(0, 8));
  }, []);

  // Au montage : précharger les commandes déjà "prêtes" (affichées sans alarme)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders?restaurant_id=${restaurantId}&period=today&limit=100`);
        if (!res.ok) return;
        const rows: OrderRow[] = await res.json();
        if (cancelled) return;
        rows
          .filter((o) => o.status === "ready")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .forEach((o) => pushReady(o, false));
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [restaurantId, pushReady]);

  // Realtime : déclenché quand la cuisine fait passer une commande à "ready"
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabaseClient
      .channel(`ready-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const o = payload.new as OrderRow;
          if (o.status === "ready") pushReady(o, true);
        }
      )
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, [restaurantId, pushReady]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // Marque tout comme lu après 30 s d'inactivité
  useEffect(() => {
    if (!unreadCount) return;
    const t = setTimeout(() => {
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }, 30_000);
    return () => clearTimeout(t);
  }, [unreadCount]);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleNotifClick(n: ReadyNotif) {
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setOpen(false);
    router.push("/dashboard/commandes");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
        aria-label="Plats prêts à servir"
        title="Plats prêts à servir"
      >
        {/* Cloche de service (plateau) */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h18M4 17a8 8 0 0116 0M12 9V6m0 0a1 1 0 110-2 1 1 0 010 2zM2 21h20" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Prêt à servir</span>
                {unreadCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Tout vu
                </button>
              )}
            </div>

            {notifs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-2xl mb-2">🍽️</div>
                <p className="text-slate-400 text-sm">Aucun plat prêt</p>
                <p className="text-slate-300 text-xs mt-1">La cuisine vous préviendra ici</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                      !n.read ? "bg-emerald-50/60" : ""
                    }`}
                  >
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          Table {n.table_number}
                        </span>
                        <span className="text-emerald-600 font-bold text-xs shrink-0 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Prêt ✓
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.items}</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {new Date(n.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/commandes"); }}
                className="w-full text-center text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
              >
                Voir les commandes →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

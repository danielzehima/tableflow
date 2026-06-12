"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMoney } from "./CurrencyContext";

type OrderNotif = {
  id: string;
  table_number: string;
  total: number;
  created_at: string;
  read: boolean;
};

// Singleton AudioContext — iOS Safari requires it to be resumed after a user gesture
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

function playOrderSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // ignore
  }
}

export default function OrderNotificationBell({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<OrderNotif[]>([]);
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const router = useRouter();
  const money = useMoney();

  // Unlock AudioContext on first user gesture (required by iOS Safari)
  useEffect(() => {
    const unlock = () => getAudioCtx();
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });
    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, []);

  const poll = useCallback(async () => {
    try {
      const since = encodeURIComponent(lastSeenRef.current);
      const res = await fetch(`/api/orders?restaurant_id=${restaurantId}&since=${since}`);
      if (!res.ok) return;
      const orders: OrderNotif[] = await res.json();
      if (!orders.length) return;

      // orders sorted desc, newest first
      lastSeenRef.current = orders[0].created_at;
      playOrderSound();
      setNotifs((prev) => {
        const incoming = orders.map((o) => ({ ...o, read: false }));
        return [...incoming, ...prev].slice(0, 5);
      });
    } catch {
      // network error — silently ignore
    }
  }, [restaurantId]);

  useEffect(() => {
    // Start polling 5s after mount (give page time to load)
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [poll]);

  // Auto-mark all as read after 30 s of inactivity
  const unreadCount = notifs.filter((n) => !n.read).length;
  useEffect(() => {
    if (!unreadCount) return;
    const t = setTimeout(() => {
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }, 30_000);
    return () => clearTimeout(t);
  }, [unreadCount]);

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleNotifClick(n: OrderNotif) {
    markRead(n.id);
    setOpen(false);
    router.push("/dashboard/commandes");
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        aria-label="Notifications commandes"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Commandes</span>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Tout lu
                </button>
              )}
            </div>

            {/* List */}
            {notifs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-2xl mb-2">🔔</div>
                <p className="text-slate-400 text-sm">Aucune commande pour l&apos;instant</p>
                <p className="text-slate-300 text-xs mt-1">Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                      !n.read ? "bg-orange-50/60" : ""
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-orange-500" : "bg-slate-200"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          Table {n.table_number}
                        </span>
                        <span className="text-orange-600 font-bold text-sm shrink-0">
                          {money(n.total)}
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {new Date(n.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/commandes"); }}
                className="w-full text-center text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors"
              >
                Voir toutes les commandes →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

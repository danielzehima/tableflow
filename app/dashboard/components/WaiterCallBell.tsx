"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type CallNotif = {
  id: string;
  table_number: string;
  type: "waiter" | "bill";
  created_at: string;
  read: boolean;
};

function playCallSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(900, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // ignore
  }
}

export default function WaiterCallBell({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [calls, setCalls] = useState<CallNotif[]>([]);
  const lastSeenRef = useRef<string>(new Date().toISOString());

  const poll = useCallback(async () => {
    try {
      const since = encodeURIComponent(lastSeenRef.current);
      const res = await fetch(`/api/tables/calls?restaurant_id=${restaurantId}&since=${since}`);
      if (!res.ok) return;
      const newCalls: CallNotif[] = await res.json();
      if (!newCalls.length) return;
      lastSeenRef.current = newCalls[0].created_at;
      playCallSound();
      setCalls((prev) => {
        const incoming = newCalls.map((c) => ({ ...c, read: false }));
        return [...incoming, ...prev].slice(0, 8);
      });
    } catch {
      // network error
    }
  }, [restaurantId]);

  useEffect(() => {
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [poll]);

  const unreadCount = calls.filter((c) => !c.read).length;

  useEffect(() => {
    if (!unreadCount) return;
    const t = setTimeout(() => {
      setCalls((prev) => prev.map((c) => ({ ...c, read: true })));
    }, 30_000);
    return () => clearTimeout(t);
  }, [unreadCount]);

  async function acknowledge(id: string) {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, read: true } : c)));
    await fetch("/api/tables/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function markAllRead() {
    setCalls((prev) => prev.map((c) => ({ ...c, read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        aria-label="Appels de table"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Appels de table</span>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Tout lu
                </button>
              )}
            </div>

            {calls.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-2xl mb-2">📞</div>
                <p className="text-slate-400 text-sm">Aucun appel en attente</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {calls.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { acknowledge(c.id); setOpen(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 ${!c.read ? "bg-blue-50/50" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${!c.read ? "bg-blue-500" : "bg-slate-200"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {c.type === "waiter" ? "🔔" : "💳"} Table {c.table_number}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${c.type === "waiter" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-600"}`}>
                          {c.type === "waiter" ? "Serveur" : "Addition"}
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {new Date(c.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 px-4 py-2.5">
              <p className="text-center text-slate-400 text-xs">Cliquer pour marquer comme traité</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

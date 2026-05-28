"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "../../lib/supabase-client";

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";

type Order = {
  id: string;
  table_number: string;
  items: string;
  total: number | string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
};

function elapsed(created_at: string) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
  if (diff < 1) return "< 1 min";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, "0")}`;
}

function urgencyColor(created_at: string) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
  if (diff >= 20) return "border-red-500 bg-red-900/50";
  if (diff >= 10) return "border-orange-500 bg-orange-900/50";
  return "border-slate-700 bg-slate-800/60";
}

export default function CuisinePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [, setTick] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);

  function toggleSound() {
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      } catch { /* ignore */ }
    }
    if (audioCtxRef.current?.state === "suspended") void audioCtxRef.current.resume();
    setSoundEnabled((prev) => { soundEnabledRef.current = !prev; return !prev; });
  }

  const isActive = (status: string) =>
    status === "pending" || status === "preparing" || status === "ready" ||
    status === "En cours"; // compatibilité avant migration

  const normalize = (o: Order): Order => ({
    ...o,
    status: o.status === ("En cours" as OrderStatus) ? "pending" : o.status,
  });

  const loadOrders = useCallback(async (rid: string) => {
    const r = await fetch(`/api/orders?restaurant_id=${rid}`);
    if (r.ok) {
      const all: Order[] = await r.json();
      setOrders(all.filter((o) => isActive(o.status)).map(normalize));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/restaurant");
      if (!res.ok) { setLoading(false); return; }
      const restaurant = await res.json();
      setRestaurantId(restaurant.id);
      await loadOrders(restaurant.id);
      setLoading(false);
    }
    init();
  }, [loadOrders]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabaseClient
      .channel(`cuisine-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            if (soundEnabledRef.current && audioCtxRef.current) {
              try {
                const ctx = audioCtxRef.current;
                [880, 660].forEach((freq, i) => {
                  const osc = ctx.createOscillator();
                  const g = ctx.createGain();
                  osc.connect(g);
                  g.connect(ctx.destination);
                  osc.frequency.value = freq;
                  osc.type = "sine";
                  const t = ctx.currentTime + i * 0.18;
                  g.gain.setValueAtTime(0.35, t);
                  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                  osc.start(t);
                  osc.stop(t + 0.25);
                });
              } catch { /* Audio API indisponible */ }
            }
            const o = normalize(payload.new as Order);
            if (isActive(o.status)) {
              setOrders((prev) => [...prev, o].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = normalize(payload.new as Order);
            setOrders((prev) => {
              const without = prev.filter((o) => o.id !== updated.id);
              if (!isActive(updated.status)) return without;
              return [...without, updated].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => { supabaseClient.removeChannel(channel); };
  }, [restaurantId]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  async function advance(id: string, next: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok && restaurantId) {
        await loadOrders(restaurantId);
      }
    } finally {
      setUpdating(null);
    }
  }

  const pending   = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready     = orders.filter((o) => o.status === "ready");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Vue Cuisine</h1>
          <p className="text-slate-200 text-sm mt-0.5">
            {orders.length === 0 ? "Aucune commande active" : `${orders.length} commande${orders.length > 1 ? "s" : ""} active${orders.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span className="text-slate-200">{connected ? "En direct" : "Connexion…"}</span>
          </div>
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Désactiver le son" : "Activer le son (cliquer pour débloquer sur iOS)"}
            className={`p-2 rounded-xl text-base transition-colors ${soundEnabled ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-slate-800 text-slate-500 hover:text-slate-400"}`}
          >
            {soundEnabled ? "🔔" : "🔕"}
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <div className="text-white font-semibold text-lg">Cuisine libre !</div>
          <div className="text-slate-200 text-sm mt-1">Les nouvelles commandes apparaîtront ici en temps réel.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne En attente */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">En attente</h2>
              {pending.length > 0 && (
                <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
              )}
            </div>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="text-slate-200 text-sm text-center py-8 border border-dashed border-slate-700 rounded-2xl">Aucune</div>
              ) : (
                pending.map((order) => (
                  <OrderCard key={order.id} order={order} updating={updating}
                    primaryAction={{ label: "Démarrer", next: "preparing" as OrderStatus }}
                    onAdvance={advance} />
                ))
              )}
            </div>
          </div>

          {/* Colonne En préparation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">En préparation</h2>
              {preparing.length > 0 && (
                <span className="ml-auto bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">{preparing.length}</span>
              )}
            </div>
            <div className="space-y-3">
              {preparing.length === 0 ? (
                <div className="text-slate-200 text-sm text-center py-8 border border-dashed border-slate-700 rounded-2xl">Aucune</div>
              ) : (
                preparing.map((order) => (
                  <OrderCard key={order.id} order={order} updating={updating}
                    primaryAction={{ label: "Marquer prêt", next: "ready" as OrderStatus }}
                    onAdvance={advance} />
                ))
              )}
            </div>
          </div>

          {/* Colonne Prêt à servir */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Prêt à servir</h2>
              {ready.length > 0 && (
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">{ready.length}</span>
              )}
            </div>
            <div className="space-y-3">
              {ready.length === 0 ? (
                <div className="text-slate-200 text-sm text-center py-8 border border-dashed border-slate-700 rounded-2xl">Aucune</div>
              ) : (
                ready.map((order) => (
                  <OrderCard key={order.id} order={order} updating={updating}
                    primaryAction={{ label: "Servir", next: "served" as OrderStatus }}
                    onAdvance={advance} />
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Légende urgences */}
      <div className="flex items-center gap-4 text-xs text-slate-200 pt-2">
        <span className="font-semibold">Urgence :</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-slate-600 bg-slate-800/60 inline-block" /> Normal</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-orange-500 bg-orange-900/50 inline-block" /> +10 min</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-red-500 bg-red-900/50 inline-block" /> +20 min</span>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  updating,
  primaryAction,
  onAdvance,
}: {
  order: Order;
  updating: string | null;
  primaryAction: { label: string; next: OrderStatus };
  onAdvance: (id: string, next: OrderStatus) => void;
}) {
  const busy = updating === order.id;
  const urgency = urgencyColor(order.created_at);

  return (
    <div className={`rounded-2xl border-2 p-4 transition-colors ${urgency}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl font-black text-white leading-none">
          {order.table_number}
        </div>
        <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2 py-1 rounded-lg">
          {elapsed(order.created_at)}
        </span>
      </div>

      <div className="text-slate-100 text-sm leading-relaxed mb-4 space-y-0.5">
        {order.items.split(", ").map((item, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-orange-400 font-bold shrink-0">›</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-3">
          📝 {order.notes}
        </div>
      )}

      <button
        onClick={() => onAdvance(order.id, primaryAction.next)}
        disabled={busy}
        className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50
          bg-orange-500 hover:bg-orange-600 text-white">
        {busy ? "…" : primaryAction.label}
      </button>
    </div>
  );
}

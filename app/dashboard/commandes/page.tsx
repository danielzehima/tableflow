"use client";

import { useEffect, useState, useCallback } from "react";
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

type Table = { id: string; name: string };

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: "En attente",     color: "bg-orange-500/15 text-orange-400 border border-orange-500/30",   dot: "bg-orange-400" },
  preparing: { label: "En préparation", color: "bg-blue-500/15 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
  ready:     { label: "Prêt",           color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  served:    { label: "Servi",          color: "bg-slate-500/15 text-green-700 border border-slate-600",          dot: "bg-slate-400" },
  paid:      { label: "Payé",           color: "bg-gray-500/15 text-gray-400 border border-gray-600",             dot: "bg-gray-400" },
  cancelled: { label: "Annulé",         color: "bg-red-500/15 text-red-400 border border-red-500/30",             dot: "bg-red-400" },
};

const NEXT_STATUS: Record<string, { status: OrderStatus; label: string }> = {
  pending:   { status: "preparing", label: "Démarrer" },
  preparing: { status: "ready",     label: "Marquer prêt" },
  ready:     { status: "served",    label: "Servir" },
  served:    { status: "paid",      label: "Encaisser" },
};

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all",      label: "Toutes" },
  { key: "pending",  label: "En attente" },
  { key: "preparing",label: "En préparation" },
  { key: "ready",    label: "Prêt" },
  { key: "served",   label: "Servi" },
  { key: "paid",     label: "Payé" },
];

const EMPTY_ORDER = { table_number: "", items: "", notes: "", total: "" };

function elapsed(created_at: string) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
  if (diff < 1) return "< 1 min";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, "0")}`;
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [connected, setConnected] = useState(false);
  const [, setTick] = useState(0);

  // Nouvelle commande
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ ...EMPTY_ORDER });
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");

  const normalize = (o: Order): Order => {
    const map: Record<string, OrderStatus> = {
      "En cours":  "pending",
      "Servi":     "served",
      "Payé":      "paid",
      "Annulé":    "cancelled",
    };
    return map[o.status as string] ? { ...o, status: map[o.status as string] } : o;
  };

  const loadOrders = useCallback(async (rid: string) => {
    const r = await fetch(`/api/orders?restaurant_id=${rid}`);
    if (r.ok) {
      const data: Order[] = await r.json();
      setOrders(data.map(normalize));
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

      // Charger les tables pour le formulaire
      const tr = await fetch(`/api/tables?restaurant_id=${restaurant.id}`);
      if (tr.ok) setTables(await tr.json());

      setLoading(false);
    }
    init();
  }, [loadOrders]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabaseClient
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [normalize(payload.new as Order), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) => prev.map((o) => o.id === (payload.new as Order).id ? normalize(payload.new as Order) : o));
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
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  async function advance(id: string, nextStatus: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok && restaurantId) await loadOrders(restaurantId);
    } finally {
      setUpdating(null);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Annuler cette commande ?")) return;
    setUpdating(id);
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (restaurantId) await loadOrders(restaurantId);
    } finally {
      setUpdating(null);
    }
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;
    setOrderSaving(true);
    setOrderError("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        table_number: orderForm.table_number,
        items: orderForm.items,
        notes: orderForm.notes || undefined,
        total: Number(orderForm.total),
      }),
    });

    if (res.ok) {
      setShowNewOrder(false);
      setOrderForm({ ...EMPTY_ORDER });
      await loadOrders(restaurantId);
    } else {
      const d = await res.json();
      setOrderError(d.error ?? "Erreur lors de la création");
    }
    setOrderSaving(false);
  }

  function exportCSV() {
    const headers = ["Table", "Articles", "Total (FCFA)", "Statut", "Date"];
    const rows = filtered.map((o) => [
      `"${o.table_number}"`,
      `"${o.items.replace(/"/g, '""')}"`,
      Number(o.total),
      STATUS_CONFIG[o.status]?.label ?? o.status,
      `"${new Date(o.created_at).toLocaleString("fr-FR")}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-${new Date().toLocaleDateString("fr-CA")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const today = new Date().toLocaleDateString("fr-CA");
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const activeOrders = orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status));
  const revenue = todayOrders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="bg-white rounded-2xl h-24 border border-slate-100" />)}
        </div>
        <div className="bg-white rounded-2xl h-64 border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Commandes</h1>
          <p className="text-green-700 text-sm mt-0.5">{orders.length} commande{orders.length > 1 ? "s" : ""} au total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            <span className="text-green-700">{connected ? "En direct" : "Hors ligne"}</span>
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter CSV
          </button>
          <button
            onClick={() => { setShowNewOrder(true); setOrderError(""); setOrderForm({ ...EMPTY_ORDER }); }}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Modal Nouvelle commande */}
      {showNewOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowNewOrder(false)} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Nouvelle commande</h2>
                <button onClick={() => setShowNewOrder(false)} className="p-1.5 text-green-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={createOrder} className="px-6 py-5 space-y-4">
                {orderError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{orderError}</div>
                )}

                {/* Table */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Table <span className="text-red-400">*</span></label>
                  {tables.length > 0 ? (
                    <select
                      value={orderForm.table_number}
                      onChange={(e) => setOrderForm({ ...orderForm, table_number: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Sélectionner une table…</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={orderForm.table_number}
                      onChange={(e) => setOrderForm({ ...orderForm, table_number: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Ex : Table 5, VIP, Terrasse…"
                    />
                  )}
                </div>

                {/* Articles */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Articles commandés <span className="text-red-400">*</span></label>
                  <textarea
                    value={orderForm.items}
                    onChange={(e) => setOrderForm({ ...orderForm, items: e.target.value })}
                    required
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    placeholder="Ex : 2x Thiéboudienne, 1x Coca Cola, 1x Attiéké…"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-green-700 font-normal">(optionnel)</span></label>
                  <input
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Sans piment, allergie noix…"
                  />
                </div>

                {/* Total */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Total (FCFA) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={orderForm.total}
                    onChange={(e) => setOrderForm({ ...orderForm, total: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Ex : 7500"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowNewOrder(false)}
                    className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={orderSaving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {orderSaving ? "Création…" : "Créer la commande"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-2xl font-extrabold text-slate-900">{revenue.toLocaleString("fr-FR")} F</div>
          <div className="text-xs text-green-700 mt-0.5">Chiffre du jour</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">🛎️</div>
          <div className="text-2xl font-extrabold text-slate-900">{todayOrders.length}</div>
          <div className="text-xs text-green-700 mt-0.5">Commandes aujourd&apos;hui</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-2xl font-extrabold text-slate-900">{activeOrders.length}</div>
          <div className="text-xs text-green-700 mt-0.5">En cours maintenant</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => {
          const count = key === "all" ? orders.length : orders.filter((o) => o.status === key).length;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === key ? "bg-orange-500 text-white" : "bg-white text-green-700 border border-slate-200 hover:border-orange-300"
              }`}>
              {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{filter === "all" ? "Toutes les commandes" : STATUS_CONFIG[filter as OrderStatus]?.label}</h2>
          <span className="text-xs text-green-700">{filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-green-700 text-sm">Aucune commande</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-green-700 uppercase tracking-wider border-b border-slate-50">
                  <th className="px-4 md:px-6 py-3 font-medium">Table</th>
                  <th className="px-4 md:px-6 py-3 font-medium hidden sm:table-cell">Articles</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Total</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Statut</th>
                  <th className="px-4 md:px-6 py-3 font-medium hidden md:table-cell">Durée</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const next = NEXT_STATUS[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-bold text-slate-900 text-base">
                        {order.table_number}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-green-700 max-w-[200px] truncate hidden sm:table-cell">
                        {order.items}
                      </td>
                      <td className="px-4 md:px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {Number(order.total).toLocaleString("fr-FR")} F
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-green-700 text-xs hidden md:table-cell whitespace-nowrap">
                        {elapsed(order.created_at)}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {next && (
                            <button onClick={() => advance(order.id, next.status)} disabled={updating === order.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap">
                              {updating === order.id ? "…" : next.label}
                            </button>
                          )}
                          {(order.status === "pending" || order.status === "preparing") && (
                            <button onClick={() => cancel(order.id)} disabled={updating === order.id}
                              className="text-xs font-semibold px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50">
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMoney } from "../components/CurrencyContext";

// ── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";

type OrderItem = { name: string; quantity: number; price: number };

type Order = {
  id: string;
  table_number: string;
  status: OrderStatus;
  items: OrderItem[] | string;
  total: number;
  created_at: string;
};

type TableState = "libre" | "commande" | "prete" | "urgente";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "served"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseItems(items: OrderItem[] | string): OrderItem[] {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* not JSON, try text format */ }
    return items
      .split(",")
      .map((s) => s.trim())
      .flatMap((part) => {
        const m = part.match(/^(\d+)x\s+(.+)$/);
        return m ? [{ quantity: parseInt(m[1], 10), name: m[2].trim(), price: 0 }] : [];
      });
  }
  return [];
}

function getTableState(orders: Order[]): TableState {
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  if (active.length === 0) return "libre";

  if (active.some((o) => o.status === "ready")) return "prete";

  const now = Date.now();
  const urgent = active.some(
    (o) => (now - new Date(o.created_at).getTime()) / 60000 > 20
  );
  return urgent ? "urgente" : "commande";
}

function elapsed(date: string): string {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

// ── State configs ─────────────────────────────────────────────────────────────

const STATE_STYLE: Record<TableState, {
  card: string; badge: string; label: string; pulse: boolean;
}> = {
  libre:    { card: "bg-white border-slate-200 hover:border-slate-300",             badge: "bg-emerald-100 text-emerald-700", label: "Libre",   pulse: false },
  commande: { card: "bg-orange-50 border-orange-300 hover:border-orange-400",       badge: "bg-orange-100 text-orange-700",   label: "En cours", pulse: false },
  prete:    { card: "bg-emerald-50 border-emerald-400 hover:border-emerald-500",    badge: "bg-emerald-500 text-white",        label: "Prête !",  pulse: true  },
  urgente:  { card: "bg-red-50 border-red-400 hover:border-red-500",               badge: "bg-red-500 text-white",            label: "Urgent !",  pulse: true  },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", preparing: "En préparation",
  ready: "Prêt", served: "Servi", paid: "Payé", cancelled: "Annulé",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function SallePage() {
  const money = useMoney();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tableCount, setTableCount] = useState(12);
  const [showConfig, setShowConfig] = useState(false);
  const [configInput, setConfigInput] = useState("12");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger le nombre de tables depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem("tf_table_count");
    if (stored) {
      const n = parseInt(stored);
      if (n >= 1 && n <= 60) {
        setTableCount(n);
        setConfigInput(String(n));
      }
    }
  }, []);

  const loadOrders = useCallback(async (rid: string) => {
    const res = await fetch(`/api/orders?restaurant_id=${rid}&limit=200`);
    if (!res.ok) return;
    const data: Order[] = await res.json();
    setOrders(data);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/restaurant");
      if (!res.ok) { setLoading(false); return; }
      const r = await res.json();
      setRestaurantId(r.id);
      await loadOrders(r.id);
      setLoading(false);
    }
    init();
  }, [loadOrders]);

  // Rafraîchissement toutes les 15 secondes
  useEffect(() => {
    if (!restaurantId) return;
    intervalRef.current = setInterval(() => loadOrders(restaurantId), 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [restaurantId, loadOrders]);

  function saveConfig() {
    const n = parseInt(configInput);
    if (isNaN(n) || n < 1 || n > 60) return;
    setTableCount(n);
    localStorage.setItem("tf_table_count", String(n));
    setShowConfig(false);
    setSelectedTable(null);
  }

  // Grouper les commandes actives par table
  const ordersByTable = new Map<number, Order[]>();
  for (let i = 1; i <= tableCount; i++) {
    const tableOrders = orders.filter(
      (o) =>
        String(o.table_number) === String(i) &&
        ACTIVE_STATUSES.includes(o.status)
    );
    ordersByTable.set(i, tableOrders);
  }

  const selectedOrders = selectedTable ? (ordersByTable.get(selectedTable) ?? []) : [];
  const selectedState = selectedTable ? getTableState(selectedOrders) : "libre";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Plan de salle</h1>
          {lastRefresh && (
            <p className="text-xs text-slate-400 mt-0.5">
              Mis à jour à {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {" "}· actualisation auto toutes les 15 s
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => restaurantId && loadOrders(restaurantId)}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
            title="Actualiser"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => { setShowConfig(true); setConfigInput(String(tableCount)); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {tableCount} tables
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3">
        {(["libre", "commande", "prete", "urgente"] as TableState[]).map((state) => (
          <div key={state} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className={`w-3 h-3 rounded-sm ${
              state === "libre"    ? "bg-slate-200" :
              state === "commande" ? "bg-orange-400" :
              state === "prete"    ? "bg-emerald-500" :
                                     "bg-red-500"
            }`} />
            {STATE_STYLE[state].label}
          </div>
        ))}
      </div>

      {/* Grille des tables */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNum) => {
          const tableOrders = ordersByTable.get(tableNum) ?? [];
          const state = getTableState(tableOrders);
          const style = STATE_STYLE[state];
          const activeOrders = tableOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
          const total = activeOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
          const oldest = activeOrders.length > 0
            ? activeOrders.reduce((a, b) =>
                new Date(a.created_at) < new Date(b.created_at) ? a : b
              )
            : null;

          return (
            <button
              key={tableNum}
              onClick={() => setSelectedTable(tableNum === selectedTable ? null : tableNum)}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all cursor-pointer
                ${style.card}
                ${selectedTable === tableNum ? "ring-2 ring-orange-400 ring-offset-2" : ""}
              `}
            >
              {/* Badge état */}
              {state !== "libre" && (
                <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.badge} ${style.pulse ? "animate-pulse" : ""}`}>
                  {style.label}
                </span>
              )}

              {/* Numéro de table */}
              <span className={`text-2xl font-extrabold leading-none ${
                state === "libre" ? "text-slate-400" :
                state === "commande" ? "text-orange-600" :
                state === "prete" ? "text-emerald-700" :
                "text-red-600"
              }`}>
                {tableNum}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Table</span>

              {/* Infos commande */}
              {oldest && (
                <div className="mt-1.5 text-center">
                  <div className={`text-[10px] font-semibold ${
                    state === "urgente" ? "text-red-600" : "text-slate-500"
                  }`}>
                    {elapsed(oldest.created_at)}
                  </div>
                  {total > 0 && (
                    <div className="text-[9px] text-slate-400">
                      {new Intl.NumberFormat("fr-FR").format(total)} F
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Compteurs résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["libre", "commande", "prete", "urgente"] as TableState[]).map((state) => {
          const count = Array.from({ length: tableCount }, (_, i) => i + 1).filter(
            (n) => getTableState(ordersByTable.get(n) ?? []) === state
          ).length;
          return (
            <div key={state} className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-center">
              <div className={`text-2xl font-extrabold ${
                state === "libre" ? "text-slate-400" :
                state === "commande" ? "text-orange-500" :
                state === "prete" ? "text-emerald-600" :
                "text-red-500"
              }`}>{count}</div>
              <div className="text-xs text-slate-500 mt-0.5">{STATE_STYLE[state].label}</div>
            </div>
          );
        })}
      </div>

      {/* Drawer — détail table sélectionnée */}
      {selectedTable && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
          {/* Header drawer */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">Table {selectedTable}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATE_STYLE[selectedState].badge}`}>
                {STATE_STYLE[selectedState].label}
              </span>
            </div>
            <button
              onClick={() => setSelectedTable(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {selectedOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-slate-700">Table libre</p>
                <p className="text-slate-400 text-sm mt-1">Aucune commande en cours</p>
              </div>
            ) : (
              selectedOrders.map((order) => {
                const items = parseItems(order.items);
                return (
                  <div key={order.id} className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {elapsed(order.created_at)} ago
                      </span>
                      <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-700">
                            <span className="font-bold text-orange-500">{item.quantity}×</span> {item.name}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Intl.NumberFormat("fr-FR").format(item.price * item.quantity)} F
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between">
                      <span className="text-sm font-bold text-slate-700">Total</span>
                      <span className="text-sm font-extrabold text-orange-500">
                        {money(Number(order.total))}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer drawer */}
          <div className="px-5 py-4 border-t border-slate-100">
            <Link
              href="/dashboard/commandes"
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Voir toutes les commandes
            </Link>
          </div>
        </div>
      )}

      {/* Overlay drawer */}
      {selectedTable && (
        <div
          className="fixed inset-0 bg-black/30 z-30 sm:hidden"
          onClick={() => setSelectedTable(null)}
        />
      )}

      {/* Modal configuration */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Configurer les tables</h3>
              <p className="text-slate-500 text-sm mt-0.5">Indiquez le nombre total de tables de votre restaurant.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nombre de tables
              </label>
              <input
                type="number"
                min="1"
                max="60"
                inputMode="numeric"
                value={configInput}
                onChange={(e) => setConfigInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-slate-400 mt-1">Entre 1 et 60 tables</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveConfig}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

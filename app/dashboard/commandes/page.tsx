"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  table_number: string;
  items: string;
  total: number | string;
  status: "En cours" | "Servi" | "Payé" | "Annulé";
  created_at: string;
};

function readSlug(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)restaurant_slug=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "le-bonus";
  } catch {
    return "le-bonus";
  }
}

const statusStyle: Record<string, string> = {
  "En cours": "bg-blue-50 text-blue-600",
  Servi: "bg-amber-50 text-amber-700",
  Payé: "bg-green-50 text-green-700",
  Annulé: "bg-red-50 text-red-500",
};

const nextStatus: Record<string, string> = {
  "En cours": "Servi",
  Servi: "Payé",
};

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const slug = readSlug();
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const restaurant = await res.json();

      const r = await fetch(`/api/orders?restaurant_id=${restaurant.id}`);
      if (r.ok) setOrders(await r.json());
      setLoading(false);
    }
    init();
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: status as Order["status"] } : o))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const today = new Date().toLocaleDateString("fr-CA"); // "YYYY-MM-DD" en heure locale
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const revenue = todayOrders
    .filter((o) => o.status === "Payé")
    .reduce((s, o) => s + Number(o.total), 0);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-24 border border-slate-100" />
          ))}
        </div>
        <div className="bg-white rounded-2xl h-64 border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Commandes</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {orders.length} commande{orders.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Stats du jour */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {revenue.toLocaleString("fr-FR")} F
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Chiffre du jour</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">🛎️</div>
          <div className="text-2xl font-extrabold text-slate-900">{todayOrders.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Commandes aujourd&apos;hui</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {orders.filter((o) => o.status === "En cours").length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">En cours maintenant</div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Toutes les commandes</h2>
          <span className="text-xs text-slate-400">{orders.length}</span>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Aucune commande pour l&apos;instant
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-50">
                  <th className="px-4 md:px-6 py-3 font-medium">Table</th>
                  <th className="px-4 md:px-6 py-3 font-medium hidden sm:table-cell">Articles</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Total</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Statut</th>
                  <th className="px-4 md:px-6 py-3 font-medium hidden md:table-cell">Heure</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 md:px-6 py-4 font-semibold text-slate-900">
                      {order.table_number}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-500 max-w-[180px] truncate hidden sm:table-cell">
                      {order.items}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {Number(order.total).toLocaleString("fr-FR")} F
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 text-xs whitespace-nowrap hidden md:table-cell">
                      {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      {nextStatus[order.status] && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus[order.status])}
                          disabled={updating === order.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {updating === order.id
                            ? "…"
                            : `→ ${nextStatus[order.status]}`}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

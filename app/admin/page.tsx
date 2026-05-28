"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  plan_expires_at: string | null;
  status: string;
  created_at: string;
  onboarding_done: boolean;
  order_count: number;
  paid_order_count: number;
  revenue_orders: number;
  subscription_revenue: number;
  subscription_count: number;
};

const PLAN_COLORS: Record<string, string> = {
  free:    "bg-slate-700 text-slate-300",
  starter: "bg-blue-900 text-blue-300",
  pro:     "bg-orange-900 text-orange-300",
};
const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit", starter: "Starter", pro: "Pro",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState("starter");
  const [newMonths, setNewMonths] = useState(1);

  async function load() {
    const res = await fetch("/api/admin/restaurants");
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.ok) setRestaurants(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updatePlan(id: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan, months: newMonths }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRestaurants((prev) =>
        prev.map((r) => r.id === id ? { ...r, plan: updated.plan, plan_expires_at: updated.plan_expires_at } : r)
      );
      setSelectedId(null);
    }
    setUpdatingId(null);
  }

  const filtered = restaurants.filter((r) => {
    const matchSearch = !search.trim() ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || r.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const totalRevenue = restaurants.reduce((s, r) => s + r.subscription_revenue, 0);
  const totalOrderRevenue = restaurants.reduce((s, r) => s + r.revenue_orders, 0);
  const paidCount = restaurants.filter((r) => r.plan !== "free").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-2xl font-extrabold text-white">{restaurants.length}</div>
            <div className="text-slate-400 text-xs mt-1">Restaurants inscrits</div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-2xl font-extrabold text-orange-400">{paidCount}</div>
            <div className="text-slate-400 text-xs mt-1">Abonnés payants</div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-2xl font-extrabold text-emerald-400">
              {totalRevenue.toLocaleString("fr-FR")}
            </div>
            <div className="text-slate-400 text-xs mt-1">Revenus abonnements (FCFA)</div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-2xl font-extrabold text-blue-400">
              {totalOrderRevenue.toLocaleString("fr-FR")}
            </div>
            <div className="text-slate-400 text-xs mt-1">Revenus commandes (FCFA)</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un restaurant…"
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            {["all", "free", "starter", "pro"].map((p) => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  planFilter === p ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}>
                {p === "all" ? "Tous" : PLAN_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Restaurants</h2>
            <span className="text-slate-400 text-xs">{filtered.length} / {restaurants.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">Aucun restaurant trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-3 font-medium">Restaurant</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Commandes</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">CA commandes</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Abonnements</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Inscription</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((r) => {
                    const isPlanExpired = r.plan !== "free" && r.plan_expires_at && new Date(r.plan_expires_at) < new Date();
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{r.name}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{r.email || r.slug}</div>
                          {!r.onboarding_done && (
                            <span className="text-[10px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded-full mt-1 inline-block">Onboarding incomplet</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${PLAN_COLORS[r.plan] ?? PLAN_COLORS.free}`}>
                              {PLAN_LABELS[r.plan] ?? r.plan}
                            </span>
                            {r.plan_expires_at && (
                              <span className={`text-[10px] ${isPlanExpired ? "text-red-400" : "text-slate-500"}`}>
                                {isPlanExpired ? "Expiré " : "Expire "}{fmt(r.plan_expires_at)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-white font-semibold">{r.paid_order_count}</div>
                          <div className="text-slate-500 text-xs">{r.order_count} total</div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell text-emerald-400 font-semibold">
                          {r.revenue_orders.toLocaleString("fr-FR")} F
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="text-orange-400 font-semibold">{r.subscription_revenue.toLocaleString("fr-FR")} F</div>
                          <div className="text-slate-500 text-xs">{r.subscription_count} paiement{r.subscription_count > 1 ? "s" : ""}</div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-xs whitespace-nowrap">
                          {fmt(r.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          {selectedId === r.id ? (
                            <div className="flex flex-col gap-2 min-w-[160px]">
                              <select
                                value={newPlan}
                                onChange={(e) => setNewPlan(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                              >
                                <option value="free">Gratuit</option>
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                              </select>
                              {newPlan !== "free" && (
                                <select
                                  value={newMonths}
                                  onChange={(e) => setNewMonths(Number(e.target.value))}
                                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                                >
                                  <option value={1}>1 mois</option>
                                  <option value={3}>3 mois</option>
                                  <option value={6}>6 mois</option>
                                  <option value={12}>12 mois</option>
                                </select>
                              )}
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => updatePlan(r.id)}
                                  disabled={updatingId === r.id}
                                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {updatingId === r.id ? "…" : "Valider"}
                                </button>
                                <button
                                  onClick={() => setSelectedId(null)}
                                  className="px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setSelectedId(r.id); setNewPlan(r.plan === "free" ? "starter" : r.plan); setNewMonths(1); }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                            >
                              Changer plan
                            </button>
                          )}
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

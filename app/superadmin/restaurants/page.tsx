"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Restaurant = {
  id: string; name: string; slug: string; email: string;
  phone: string; cuisine: string; status: string; plan: string;
  plan_expires_at: string | null; created_at: string;
};

const PLAN_LABELS: Record<string, string> = { free: "Gratuit", starter: "Starter", pro: "Pro" };
const PLAN_COLORS: Record<string, string> = {
  free: "text-slate-400 bg-slate-700",
  starter: "text-blue-400 bg-blue-500/15",
  pro: "text-orange-400 bg-orange-500/15",
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [acting, setActing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Restaurant | null>(null);

  async function load() {
    const res = await fetch("/api/superadmin/restaurants");
    if (res.ok) setRestaurants(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateRestaurant(id: string, update: Partial<Restaurant>) {
    setActing(id);
    await fetch(`/api/superadmin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    await load();
    setActing(null);
  }

  async function deleteRestaurant(id: string) {
    setActing(id);
    await fetch(`/api/superadmin/restaurants/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await load();
    setActing(null);
  }

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "all" || r.plan === filterPlan;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Restaurants</h1>
        <p className="text-slate-400 text-sm mt-1">{restaurants.length} restaurant(s) inscrit(s)</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher par nom, email, slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-60 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les plans</option>
          <option value="free">Gratuit</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Aucun résultat</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3.5 font-semibold">Restaurant</th>
                  <th className="text-left px-4 py-3.5 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3.5 font-semibold">Statut</th>
                  <th className="text-left px-4 py-3.5 font-semibold hidden md:table-cell">Inscription</th>
                  <th className="text-right px-5 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-slate-500 text-xs">/{r.slug} · {r.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={r.plan ?? "free"}
                        disabled={acting === r.id}
                        onChange={(e) => updateRestaurant(r.id, { plan: e.target.value })}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 ${PLAN_COLORS[r.plan ?? "free"]} bg-transparent`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        <option value="free">Gratuit</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        r.status === "active"
                          ? "text-green-400 bg-green-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}>
                        {r.status === "active" ? "Actif" : "Suspendu"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs hidden md:table-cell">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${r.slug}`}
                          target="_blank"
                          className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Voir
                        </Link>
                        <button
                          onClick={() => updateRestaurant(r.id, { status: r.status === "active" ? "suspended" : "active" })}
                          disabled={acting === r.id}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            r.status === "active"
                              ? "text-orange-400 hover:bg-orange-500/10"
                              : "text-green-400 hover:bg-green-500/10"
                          }`}
                        >
                          {acting === r.id ? "…" : r.status === "active" ? "Suspendre" : "Activer"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(r)}
                          disabled={acting === r.id}
                          className="text-xs font-semibold text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-3xl mb-3 text-center">⚠️</div>
              <h3 className="text-white font-extrabold text-lg text-center mb-2">Supprimer ce restaurant ?</h3>
              <p className="text-slate-400 text-sm text-center mb-6">
                <strong className="text-white">{confirmDelete.name}</strong> et toutes ses données seront définitivement supprimées.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteRestaurant(confirmDelete.id)}
                  disabled={acting === confirmDelete.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {acting === confirmDelete.id ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

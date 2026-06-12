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

// ── Modale de confirmation suspension ─────────────────────────────
function ConfirmModal({
  restaurant,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  restaurant: Restaurant;
  action: "suspend" | "reactivate";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isSuspend = action === "suspend";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* En-tête colorée */}
        <div className={`px-6 py-5 flex items-center gap-3 ${isSuspend ? "bg-red-950/60 border-b border-red-900/40" : "bg-emerald-950/60 border-b border-emerald-900/40"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSuspend ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
            {isSuspend ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className={`font-bold text-base ${isSuspend ? "text-red-300" : "text-emerald-300"}`}>
              {isSuspend ? "Suspendre le restaurant" : "Réactiver le restaurant"}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">{restaurant.name}</p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-4">
          {isSuspend ? (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                Le restaurant <span className="font-bold text-white">«&nbsp;{restaurant.name}&nbsp;»</span> sera immédiatement suspendu.
              </p>
              <div className="bg-red-950/30 border border-red-900/30 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-red-300 text-xs font-semibold">Ce qui se passe après la suspension :</p>
                <ul className="space-y-1">
                  {[
                    "Le gérant ne peut plus accéder au dashboard",
                    "La page publique du restaurant est désactivée",
                    "Les commandes en ligne sont bloquées",
                    "Les données sont conservées intactes",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                Le restaurant <span className="font-bold text-white">«&nbsp;{restaurant.name}&nbsp;»</span> sera immédiatement réactivé.
              </p>
              <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-emerald-300 text-xs font-semibold">Ce qui se passe après la réactivation :</p>
                <ul className="space-y-1">
                  {[
                    "Le gérant retrouve accès à son dashboard",
                    "La page publique est de nouveau accessible",
                    "Les commandes en ligne reprennent",
                    "Toutes les données sont restaurées",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-[2] py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              isSuspend
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {loading
              ? "En cours…"
              : isSuspend
              ? "Oui, suspendre"
              : "Oui, réactiver"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Plan change
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState("starter");
  const [newMonths, setNewMonths] = useState(1);

  // Suspension
  const [confirmTarget, setConfirmTarget] = useState<{ restaurant: Restaurant; action: "suspend" | "reactivate" } | null>(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/restaurants");
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.ok) setRestaurants(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // ── Changer le plan ──────────────────────────────────────────────
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
        prev.map((r) => r.id === id ? { ...r, ...updated } : r)
      );
      setSelectedId(null);
    }
    setUpdatingId(null);
  }

  // ── Suspendre / Réactiver ────────────────────────────────────────
  async function executeStatusChange() {
    if (!confirmTarget) return;
    setSuspendLoading(true);
    const res = await fetch(`/api/admin/restaurants/${confirmTarget.restaurant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: confirmTarget.action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRestaurants((prev) =>
        prev.map((r) => r.id === updated.id ? { ...r, status: updated.status } : r)
      );
    }
    setSuspendLoading(false);
    setConfirmTarget(null);
  }

  // ── Filtres ──────────────────────────────────────────────────────
  const filtered = restaurants.filter((r) => {
    const matchSearch = !search.trim() ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || r.plan === planFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────────────────
  const totalRevenue  = restaurants.reduce((s, r) => s + r.subscription_revenue, 0);
  const totalOrderRev = restaurants.reduce((s, r) => s + r.revenue_orders, 0);
  const paidCount     = restaurants.filter((r) => r.plan !== "free").length;
  const suspendedCount = restaurants.filter((r) => r.status === "suspended").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Modale de confirmation */}
      {confirmTarget && (
        <ConfirmModal
          restaurant={confirmTarget.restaurant}
          action={confirmTarget.action}
          onConfirm={executeStatusChange}
          onCancel={() => setConfirmTarget(null)}
          loading={suspendLoading}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats globales ── */}
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
              {totalOrderRev.toLocaleString("fr-FR")}
            </div>
            <div className="text-slate-400 text-xs mt-1">Revenus commandes (FCFA)</div>
          </div>
        </div>

        {/* ── Bannière suspendus (si > 0) ── */}
        {suspendedCount > 0 && (
          <div className="flex items-center gap-3 bg-red-950/50 border border-red-900/40 rounded-2xl px-5 py-3.5">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-300 text-sm font-semibold">
              {suspendedCount} restaurant{suspendedCount > 1 ? "s" : ""} actuellement suspendu{suspendedCount > 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setStatusFilter("suspended")}
              className="ml-auto text-xs text-red-400 hover:text-red-200 underline underline-offset-2 transition-colors"
            >
              Voir
            </button>
          </div>
        )}

        {/* ── Filtres ── */}
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
          <div className="flex flex-wrap gap-2">
            {/* Filtre plan */}
            {["all", "free", "starter", "pro"].map((p) => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  planFilter === p ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}>
                {p === "all" ? "Tous plans" : PLAN_LABELS[p]}
              </button>
            ))}
            {/* Séparateur */}
            <div className="w-px bg-slate-700 mx-1" />
            {/* Filtre statut */}
            {[
              { key: "all",       label: "Tous statuts" },
              { key: "active",    label: "✓ Actifs" },
              { key: "suspended", label: "⊘ Suspendus" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === key
                    ? key === "suspended" ? "bg-red-600 text-white" : "bg-emerald-700 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tableau ── */}
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
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((r) => {
                    const isSuspended   = r.status === "suspended";
                    const isPlanExpired = r.plan !== "free" && r.plan_expires_at && new Date(r.plan_expires_at) < new Date();

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isSuspended
                            ? "bg-red-950/10 hover:bg-red-950/20"
                            : "hover:bg-slate-800/50"
                        }`}
                      >
                        {/* Nom + infos */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2.5">
                            {/* Indicateur statut */}
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSuspended ? "bg-red-500" : "bg-emerald-500"}`} title={isSuspended ? "Suspendu" : "Actif"} />
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                                {r.name}
                                {isSuspended && (
                                  <span className="text-[10px] font-bold bg-red-900/60 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded-full">
                                    SUSPENDU
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-xs mt-0.5">{r.email || r.slug}</div>
                              {!r.onboarding_done && (
                                <span className="text-[10px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                                  Onboarding incomplet
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
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

                        {/* Commandes */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-white font-semibold">{r.paid_order_count}</div>
                          <div className="text-slate-500 text-xs">{r.order_count} total</div>
                        </td>

                        {/* CA */}
                        <td className="px-6 py-4 hidden lg:table-cell text-emerald-400 font-semibold">
                          {r.revenue_orders.toLocaleString("fr-FR")} F
                        </td>

                        {/* Abonnements */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="text-orange-400 font-semibold">{r.subscription_revenue.toLocaleString("fr-FR")} F</div>
                          <div className="text-slate-500 text-xs">{r.subscription_count} paiement{r.subscription_count > 1 ? "s" : ""}</div>
                        </td>

                        {/* Date inscription */}
                        <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-xs whitespace-nowrap">
                          {fmt(r.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">

                            {/* Changement de plan */}
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
                                onClick={() => {
                                  setSelectedId(r.id);
                                  setNewPlan(r.plan === "free" ? "starter" : r.plan);
                                  setNewMonths(1);
                                }}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                              >
                                Changer plan
                              </button>
                            )}

                            {/* Bouton suspendre / réactiver */}
                            {isSuspended ? (
                              <button
                                onClick={() => setConfirmTarget({ restaurant: r, action: "reactivate" })}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-400 hover:text-emerald-300 border border-emerald-800/30 transition-colors whitespace-nowrap"
                              >
                                ✓ Réactiver
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmTarget({ restaurant: r, action: "suspend" })}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-900/30 transition-colors whitespace-nowrap"
                              >
                                ⊘ Suspendre
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
    </>
  );
}

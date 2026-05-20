"use client";

import { useEffect, useState } from "react";

type Restaurant = {
  id: string; name: string; slug: string; email: string;
  status: string; plan: string; plan_expires_at: string | null; created_at: string;
};

const PLANS = [
  {
    key: "free", label: "Gratuit", price: "0 FCFA",
    color: "border-slate-700", badge: "text-slate-400 bg-slate-800",
    features: ["Page publique", "Menu en ligne", "Réservations (5/mois)"],
  },
  {
    key: "starter", label: "Starter", price: "9 900 FCFA/mois",
    color: "border-blue-500/40", badge: "text-blue-400 bg-blue-500/15",
    features: ["Tout Gratuit", "Réservations illimitées", "Commandes en ligne", "Stats basiques"],
  },
  {
    key: "pro", label: "Pro", price: "24 900 FCFA/mois",
    color: "border-orange-500/40", badge: "text-orange-400 bg-orange-500/15",
    features: ["Tout Starter", "Bannière personnalisée", "Support prioritaire", "Stats avancées"],
  },
];

export default function AbonnementsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [form, setForm] = useState({ plan: "free", plan_expires_at: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/superadmin/restaurants");
    if (res.ok) setRestaurants(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(r: Restaurant) {
    setSelected(r);
    setForm({
      plan: r.plan ?? "free",
      plan_expires_at: r.plan_expires_at ? r.plan_expires_at.split("T")[0] : "",
    });
  }

  async function savePlan() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/superadmin/restaurants/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: form.plan,
        plan_expires_at: form.plan_expires_at ? new Date(form.plan_expires_at).toISOString() : null,
      }),
    });
    await load();
    setSelected(null);
    setSaving(false);
  }

  const byPlan = PLANS.map((p) => ({
    ...p,
    restaurants: restaurants.filter((r) => (r.plan ?? "free") === p.key),
  }));

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Abonnements</h1>
        <p className="text-slate-400 text-sm mt-1">Gérez les plans de chaque restaurant</p>
      </div>

      {/* Plans overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const count = restaurants.filter((r) => (r.plan ?? "free") === p.key).length;
          return (
            <div key={p.key} className={`bg-slate-900 border ${p.color} rounded-2xl p-5`}>
              <div className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${p.badge}`}>
                {p.label}
              </div>
              <div className="text-3xl font-extrabold text-white">{count}</div>
              <div className="text-slate-400 text-xs mt-0.5">restaurant(s)</div>
              <div className="text-slate-500 text-xs mt-2 font-medium">{p.price}</div>
              <ul className="mt-3 space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Liste par plan */}
      {loading ? (
        <div className="text-center text-slate-500 py-10">Chargement…</div>
      ) : (
        byPlan.map((p) => p.restaurants.length > 0 && (
          <div key={p.key} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className={`px-5 py-3.5 border-b border-slate-800 flex items-center gap-2`}>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badge}`}>{p.label}</span>
              <span className="text-slate-500 text-xs">{p.restaurants.length} restaurant(s)</span>
            </div>
            <div className="divide-y divide-slate-800">
              {p.restaurants.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="text-white font-semibold text-sm">{r.name}</div>
                    <div className="text-slate-500 text-xs">{r.email} · /{r.slug}</div>
                    {r.plan_expires_at && (
                      <div className="text-xs text-amber-400 mt-0.5">
                        Expire le {new Date(r.plan_expires_at).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(r)}
                    className="text-xs font-semibold text-orange-400 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal édition plan */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-white font-extrabold text-lg mb-1">{selected.name}</h3>
              <p className="text-slate-400 text-sm mb-5">{selected.email}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Plan
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="free">Gratuit</option>
                    <option value="starter">Starter — 9 900 FCFA/mois</option>
                    <option value="pro">Pro — 24 900 FCFA/mois</option>
                  </select>
                </div>

                {form.plan !== "free" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Date d&apos;expiration
                    </label>
                    <input
                      type="date"
                      value={form.plan_expires_at}
                      onChange={(e) => setForm({ ...form, plan_expires_at: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={savePlan}
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

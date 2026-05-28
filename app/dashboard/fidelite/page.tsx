"use client";

import { useEffect, useState } from "react";

type Settings = {
  loyalty_enabled: boolean;
  loyalty_points_per_order: number;
  loyalty_threshold: number;
  loyalty_reward: string;
};

type LoyalCustomer = {
  id: string;
  name: string;
  phone: string;
  loyalty_points: number;
  order_count: number;
};

export default function FidelitePage() {
  const [settings, setSettings] = useState<Settings>({
    loyalty_enabled: false,
    loyalty_points_per_order: 1,
    loyalty_threshold: 10,
    loyalty_reward: "Réduction de 500 FCFA",
  });
  const [customers, setCustomers] = useState<LoyalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    async function load() {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/dashboard/loyalty/settings"),
        fetch("/api/dashboard/loyalty/customers"),
      ]);
      if (sRes.ok) setSettings(await sRes.json());
      if (cRes.ok) {
        const data: LoyalCustomer[] = await cRes.json();
        setCustomers(data);
        setTotalPoints(data.reduce((s, c) => s + c.loyalty_points, 0));
        setReadyCount(0); // will be computed below
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    setReadyCount(customers.filter((c) => c.loyalty_points >= settings.loyalty_threshold).length);
  }, [customers, settings.loyalty_threshold]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/dashboard/loyalty/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progress = (pts: number) =>
    Math.min(100, Math.round((pts / settings.loyalty_threshold) * 100));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Programme de fidélité</h1>
        <p className="text-slate-500 text-sm mt-1">
          Récompensez vos clients réguliers automatiquement à chaque commande.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="text-2xl font-extrabold text-slate-900">{totalPoints}</div>
          <div className="text-xs text-slate-500 mt-0.5">Points distribués</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="text-2xl font-extrabold text-orange-500">{readyCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Récompenses disponibles</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="text-2xl font-extrabold text-slate-900">{customers.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Clients inscrits</div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
        <h2 className="font-extrabold text-slate-900">Configuration</h2>

        {/* Activation */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <div className="font-semibold text-slate-800 text-sm">Activer le programme</div>
            <div className="text-xs text-slate-400 mt-0.5">Les clients gagnent des points à chaque commande avec téléphone</div>
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, loyalty_enabled: !s.loyalty_enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.loyalty_enabled ? "bg-orange-500" : "bg-slate-200"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.loyalty_enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Points par commande */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Points gagnés par commande
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.loyalty_points_per_order}
            onChange={(e) => setSettings((s) => ({ ...s, loyalty_points_per_order: parseInt(e.target.value) || 1 }))}
            className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="text-xs text-slate-400 mt-1">Le client gagne ce nombre de points à chaque commande.</p>
        </div>

        {/* Seuil récompense */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Points nécessaires pour une récompense
          </label>
          <input
            type="number"
            min={1}
            max={9999}
            value={settings.loyalty_threshold}
            onChange={(e) => setSettings((s) => ({ ...s, loyalty_threshold: parseInt(e.target.value) || 10 }))}
            className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            Avec {settings.loyalty_points_per_order} point(s)/commande → récompense après{" "}
            <strong>{Math.ceil(settings.loyalty_threshold / settings.loyalty_points_per_order)} commandes</strong>.
          </p>
        </div>

        {/* Description récompense */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Description de la récompense
          </label>
          <input
            type="text"
            maxLength={100}
            value={settings.loyalty_reward}
            onChange={(e) => setSettings((s) => ({ ...s, loyalty_reward: e.target.value }))}
            placeholder="Ex: Réduction de 500 FCFA, Dessert offert…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré !" : "Enregistrer"}
        </button>
      </div>

      {/* Top clients */}
      {customers.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-extrabold text-slate-900 mb-4">Clients fidèles</h2>
          <div className="space-y-3">
            {customers.map((c) => {
              const ready = c.loyalty_points >= settings.loyalty_threshold;
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-sm shrink-0">
                    {c.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm truncate">{c.name}</span>
                      {ready && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          🎁 Récompense dispo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{c.phone} · {c.order_count} commande{c.order_count > 1 ? "s" : ""}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${progress(c.loyalty_points)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 shrink-0">
                        {c.loyalty_points}/{settings.loyalty_threshold} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {customers.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400">
          <div className="text-4xl mb-3">🎁</div>
          <p className="font-semibold text-sm">Aucun client fidèle pour l&apos;instant</p>
          <p className="text-xs mt-1">Les clients qui commandent avec leur numéro apparaîtront ici.</p>
        </div>
      )}
    </div>
  );
}

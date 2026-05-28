"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PlanSetting = {
  plan: string;
  label: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  highlight: boolean;
  badge: string | null;
  cta_text: string;
  cta_href: string;
  sort_order: number;
};

const PLAN_BADGE: Record<string, string> = {
  free: "text-slate-400 bg-slate-700/60 border border-slate-600",
  starter: "text-blue-300 bg-blue-500/15 border border-blue-500/30",
  pro: "text-orange-300 bg-orange-500/15 border border-orange-500/30",
};

export default function TarifsAdminPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<PlanSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function load() {
    setLoadError("");
    const res = await fetch("/api/admin/plans");
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.ok) {
      setPlans(await res.json());
    } else {
      const d = await res.json().catch(() => ({}));
      setLoadError(d.error ?? "Impossible de charger les tarifs.");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(plan: PlanSetting) {
    setEditing({ ...plan, features: [...plan.features] });
    setError("");
    setSuccessMsg("");
  }

  function updateFeature(index: number, value: string) {
    if (!editing) return;
    const features = [...editing.features];
    features[index] = value;
    setEditing({ ...editing, features });
  }

  function addFeature() {
    if (!editing) return;
    setEditing({ ...editing, features: [...editing.features, ""] });
  }

  function removeFeature(index: number) {
    if (!editing) return;
    const features = editing.features.filter((_, i) => i !== index);
    setEditing({ ...editing, features });
  }

  function moveFeature(index: number, dir: -1 | 1) {
    if (!editing) return;
    const target = index + dir;
    if (target < 0 || target >= editing.features.length) return;
    const features = [...editing.features];
    [features[index], features[target]] = [features[target], features[index]];
    setEditing({ ...editing, features });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const features = editing.features.map((f) => f.trim()).filter(Boolean);
    const res = await fetch(`/api/admin/plans/${editing.plan}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, features }),
    });
    if (res.ok) {
      setEditing(null);
      setSuccessMsg("Tarif mis à jour. Les changements sont visibles sur la landing.");
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur lors de la sauvegarde");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tarifs</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Gérez les offres affichées sur la landing publique. Les modifications sont reflétées immédiatement.
        </p>
      </div>

      {loadError && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <span>⚠️ Erreur : {loadError}</span>
          <button onClick={load} className="underline text-xs shrink-0">Réessayer</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.plan}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-4 ${
              plan.highlight ? "border-orange-500/40" : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between min-h-6">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_BADGE[plan.plan] ?? "text-slate-400 bg-slate-700 border border-slate-600"}`}>
                {plan.label}
              </span>
              {plan.badge && (
                <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-semibold truncate ml-2">
                  {plan.badge}
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white leading-none">
                {plan.price === 0 ? "Gratuit" : plan.price.toLocaleString("fr-FR")}
              </div>
              {plan.price > 0 && (
                <div className="text-slate-400 text-xs mt-1">{plan.currency} / mois</div>
              )}
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">{plan.description}</p>

            <ul className="space-y-1.5 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-orange-400 shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => openEdit(plan)}
              className="w-full py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-slate-600"
            >
              Modifier
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => !saving && setEditing(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Modifier — {editing.label}</h2>
                <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Field label="Libellé">
                  <input
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prix (0 = gratuit)">
                    <input
                      type="number" min={0}
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value) || 0 })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Devise">
                    <select
                      value={editing.currency}
                      onChange={(e) => setEditing({ ...editing, currency: e.target.value })}
                      className={inputCls}
                    >
                      <option value="FCFA">FCFA</option>
                      <option value="€">€ (EUR)</option>
                      <option value="$">$ (USD)</option>
                    </select>
                  </Field>
                </div>

                <Field label="Description courte">
                  <input
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    className={inputCls}
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Privilèges ({editing.features.length})
                    </label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editing.features.length === 0 && (
                      <p className="text-slate-500 text-xs italic">Aucun privilège — cliquez sur « Ajouter ».</p>
                    )}
                    {editing.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-orange-400 shrink-0 text-sm">✓</span>
                        <input
                          value={f}
                          onChange={(e) => updateFeature(i, e.target.value)}
                          placeholder="Ex : Réservations illimitées"
                          className={`${inputCls} flex-1`}
                        />
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveFeature(i, -1)}
                            disabled={i === 0}
                            className="text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors p-0.5"
                            title="Monter"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFeature(i, 1)}
                            disabled={i === editing.features.length - 1}
                            className="text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors p-0.5"
                            title="Descendre"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-1"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Field label="Badge (optionnel — ex : Le plus populaire)">
                  <input
                    value={editing.badge ?? ""}
                    onChange={(e) => setEditing({ ...editing, badge: e.target.value || null })}
                    placeholder="Laisser vide pour masquer"
                    className={`${inputCls} placeholder-slate-600`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Texte du bouton">
                    <input
                      value={editing.cta_text}
                      onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="URL du bouton">
                    <input
                      value={editing.cta_href}
                      onChange={(e) => setEditing({ ...editing, cta_href: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, highlight: !editing.highlight })}
                    className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
                      editing.highlight ? "bg-orange-500" : "bg-slate-700"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      editing.highlight ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                  <span className="text-sm text-slate-300">Carte mise en avant (bordure orange)</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {saving ? "Sauvegarde…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

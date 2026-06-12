"use client";

import { useEffect, useState } from "react";
import { useMoney, useCurrency } from "../components/CurrencyContext";
import { currencySymbol } from "../../lib/currency";

type PromoCode = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtValue(code: PromoCode, money: (n: number) => string) {
  return code.type === "percent"
    ? `−${code.value}%`
    : `−${money(Number(code.value))}`;
}

export default function CodesPromoPage() {
  const money = useMoney();
  const currency = useCurrency();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    min_order: "",
    max_uses: "",
    expires_at: "",
  });

  async function load() {
    const res = await fetch("/api/promo-codes");
    if (res.ok) setCodes(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "code" ? value.toUpperCase() : value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: form.value,
        min_order: form.min_order || 0,
        max_uses: form.max_uses || null,
        expires_at: form.expires_at || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCodes((prev) => [data, ...prev]);
      setForm({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
      setShowForm(false);
    } else {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de la création");
    }
    setSaving(false);
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch(`/api/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => c.id === id ? { ...c, active: !active } : c));
    }
  }

  async function deleteCode(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/promo-codes/${id}`, { method: "DELETE" });
    if (res.ok) setCodes((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Codes promo</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Créez des réductions que vos clients peuvent saisir lors de la commande
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Nouveau code
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="font-bold text-white mb-5">Nouveau code promo</h2>
          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Code *
                </label>
                <input
                  name="code" required value={form.code} onChange={handleChange}
                  placeholder="Ex: BIENVENUE10"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                />
                <p className="text-slate-500 text-xs mt-1">Sera automatiquement en majuscules</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Type de réduction *
                </label>
                <select
                  name="type" value={form.type} onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe ({currencySymbol(currency)})</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Valeur * {form.type === "percent" ? "(en %)" : `(en ${currencySymbol(currency)})`}
                </label>
                <input
                  name="value" type="number" required value={form.value} onChange={handleChange}
                  placeholder={form.type === "percent" ? "10" : "1000"}
                  min="1" max={form.type === "percent" ? "100" : undefined}
                  step={form.type === "percent" ? 1 : (currency === "XOF" ? 50 : 0.01)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Commande minimum ({currencySymbol(currency)})
                </label>
                <input
                  name="min_order" type="number" value={form.min_order} onChange={handleChange}
                  placeholder="0 = aucun minimum"
                  min="0" step={currency === "XOF" ? 50 : 0.01}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Utilisations maximum
                </label>
                <input
                  name="max_uses" type="number" value={form.max_uses} onChange={handleChange}
                  placeholder="Vide = illimité"
                  min="1"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Date d&apos;expiration
                </label>
                <input
                  name="expires_at" type="date" value={form.expires_at} onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? "Création…" : "Créer le code"}
              </button>
              <button
                type="button" onClick={() => { setShowForm(false); setError(""); }}
                className="text-slate-400 hover:text-white text-sm px-4 py-2.5 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des codes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 px-6 py-16 text-center">
          <div className="text-5xl mb-4">🏷️</div>
          <p className="text-white font-semibold mb-1">Aucun code promo</p>
          <p className="text-slate-400 text-sm">
            Créez votre premier code pour offrir des réductions à vos clients
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-bold text-white">{codes.length} code{codes.length > 1 ? "s" : ""}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Réduction</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Min. commande</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Utilisations</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">Expiration</th>
                  <th className="px-6 py-3 font-medium">Actif</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {codes.map((code) => {
                  const isExpired = !!code.expires_at && new Date(code.expires_at) < new Date();
                  const isExhausted = code.max_uses !== null && code.uses_count >= code.max_uses;
                  return (
                    <tr key={code.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg text-xs tracking-wider">
                          {code.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-orange-400 text-base">{fmtValue(code, money)}</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-xs">
                        {code.min_order > 0
                          ? money(Number(code.min_order))
                          : <span className="text-slate-600">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-white font-semibold">{code.uses_count}</span>
                        {code.max_uses !== null && (
                          <span className="text-slate-500 text-xs"> / {code.max_uses}</span>
                        )}
                        {isExhausted && (
                          <span className="ml-2 text-[10px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full">épuisé</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs">
                        {code.expires_at ? (
                          <span className={isExpired ? "text-red-400" : "text-slate-400"}>
                            {fmt(code.expires_at)}
                            {isExpired && " · expiré"}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(code.id, code.active)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                            code.active ? "bg-emerald-500" : "bg-slate-700"
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                            code.active ? "translate-x-4" : "translate-x-0"
                          }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteCode(code.id)}
                          disabled={deletingId === code.id}
                          className="text-slate-500 hover:text-red-400 disabled:opacity-50 text-xs font-medium transition-colors"
                        >
                          {deletingId === code.id ? "…" : "Supprimer"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5">
        <h3 className="font-semibold text-white text-sm mb-3">Comment ça marche ?</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">1.</span>
            Créez un code promo (ex: PROMO20 pour -20%)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">2.</span>
            Partagez-le avec vos clients (réseaux sociaux, flyers…)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">3.</span>
            Les clients le saisissent dans leur panier lors de la commande en ligne
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">4.</span>
            La réduction est appliquée automatiquement sur le total
          </li>
        </ul>
      </div>
    </div>
  );
}

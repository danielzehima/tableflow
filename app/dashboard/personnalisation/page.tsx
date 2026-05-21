"use client";

import { useEffect, useState } from "react";

const PRESET_COLORS = [
  { label: "Orange", value: "#f97316" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Vert", value: "#22c55e" },
  { label: "Rose", value: "#ec4899" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Ardoise", value: "#475569" },
];

export default function PersonnalisationPage() {
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#f97316");
  const [welcome, setWelcome] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { setLoading(false); return; }
      const me = await meRes.json();
      const s = me.restaurant?.slug ?? "";
      setSlug(s);
      if (!s) { setLoading(false); return; }
      const res = await fetch(`/api/restaurants/${s}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setColor(data.primary_color || "#f97316");
      setWelcome(data.welcome_message || "");
      setLoading(false);
    }
    init();
  }, []);

  async function handleSave() {
    if (!slug) return;
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch(`/api/restaurants/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primary_color: color, welcome_message: welcome }),
    });
    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la sauvegarde");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-xl">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-2xl h-24 border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Personnalisation</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Apparence de votre page publique ·{" "}
          {slug && (
            <a href={`/${slug}`} target="_blank" className="text-orange-500 hover:underline font-medium">
              Voir ma page →
            </a>
          )}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          ✅ Modifications enregistrées — recharge ta page publique pour voir le résultat
        </div>
      )}

      {/* Couleur principale */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-900">Couleur principale</h2>
        <p className="text-slate-500 text-sm -mt-2">
          Appliquée sur les boutons, prix et accents de votre page menu.
        </p>

        {/* Prévisualisation */}
        <div className="rounded-xl border border-slate-100 p-4 bg-slate-50 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl shadow-md flex items-center justify-center text-white font-extrabold text-xl shrink-0"
            style={{ backgroundColor: color }}
          >
            T
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 text-sm">Mon Restaurant</div>
            <div className="text-xs mt-0.5" style={{ color }}>Cuisine africaine</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
                Commander
              </span>
              <span className="text-xs font-extrabold" style={{ color }}>2 500 FCFA</span>
            </div>
          </div>
        </div>

        {/* Couleurs preset */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Couleurs suggérées</p>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => { setColor(c.value); setSaved(false); }}
                title={c.label}
                className="w-9 h-9 rounded-xl border-2 transition-all"
                style={{
                  backgroundColor: c.value,
                  borderColor: color === c.value ? "#0f172a" : "transparent",
                  transform: color === c.value ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Color picker personnalisé */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Couleur personnalisée</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setSaved(false); }}
              className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-0.5"
            />
            <span className="font-mono text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
              {color.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Message d'accueil */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-slate-900">Message d&apos;accueil</h2>
        <p className="text-slate-500 text-sm -mt-2">
          Affiché sous le nom du restaurant sur votre page publique.
        </p>
        <div>
          <textarea
            value={welcome}
            onChange={(e) => { setWelcome(e.target.value.slice(0, 120)); setSaved(false); }}
            placeholder="Ex : Bienvenue ! Commandez directement depuis cette page 🍽️"
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{welcome.length}/120</p>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
        style={{ backgroundColor: color }}
      >
        {saving ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </div>
  );
}

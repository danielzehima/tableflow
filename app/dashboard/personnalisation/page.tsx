"use client";

import { useEffect, useRef, useState } from "react";


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

type GalleryImage = { id: string; url: string };

export default function PersonnalisationPage() {
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#f97316");
  const [welcome, setWelcome] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { setLoading(false); return; }
      const me = await meRes.json();
      const s = me.restaurant?.slug ?? "";
      setSlug(s);
      if (!s) { setLoading(false); return; }

      const [resData, resImages] = await Promise.all([
        fetch(`/api/restaurants/${s}`),
        fetch(`/api/restaurants/${s}/images`),
      ]);

      if (resData.ok) {
        const data = await resData.json();
        setColor(data.primary_color || "#f97316");
        setWelcome(data.welcome_message || "");
      }
      if (resImages.ok) {
        setImages(await resImages.json());
      }
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !slug) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/restaurants/${slug}/images`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const img = await res.json();
      setImages((prev) => [...prev, { id: img.id, url: img.url }]);
    } else {
      const d = await res.json();
      setUploadError(d.error || "Erreur lors de l'upload");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDeleteImage(id: string) {
    setImages((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/restaurants/${slug}/images/${id}`, { method: "DELETE" });
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

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Couleurs suggérées</p>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
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

      {/* Photos du restaurant */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Photos du restaurant</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Montrez votre cadre à vos clients. Max 6 photos · {images.length}/6
            </p>
          </div>
          {images.length < 6 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Upload…
                  </>
                ) : (
                  <>+ Ajouter</>
                )}
              </button>
            </>
          )}
        </div>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">{uploadError}</div>
        )}

        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="Photo restaurant"
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-xl py-8 text-center text-slate-400 hover:text-orange-400 text-sm transition-colors"
          >
            <div className="text-3xl mb-2">📸</div>
            Cliquez pour ajouter des photos de votre restaurant
          </button>
        )}
      </div>

      {/* Bouton sauvegarder */}
      <button
        type="button"
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

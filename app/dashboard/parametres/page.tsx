"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  cuisine: string;
  cover_image: string;
};

function readSlug(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)restaurant_slug=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "le-bonus";
  } catch {
    return "le-bonus";
  }
}

export default function ParametresPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const slug = readSlug();
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setRestaurant(data);
      setForm({
        name: data.name,
        description: data.description,
        tagline: data.tagline,
        address: data.address,
        phone: data.phone,
        email: data.email,
        hours: data.hours,
        cuisine: data.cuisine,
        cover_image: data.cover_image ?? "",
      });
      setLoading(false);
    }
    init();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setUploading(true);
    setUploadError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("restaurant_id", restaurant.id);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setUploadError(data.error ?? "Erreur upload");
    } else {
      const newUrl = data.url;
      setForm((prev) => ({ ...prev, cover_image: newUrl }));

      const saveRes = await fetch(`/api/restaurants/${restaurant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image: newUrl }),
      });
      if (saveRes.ok) {
        setSaved(true);
      } else {
        setUploadError("Image uploadée mais erreur lors de la sauvegarde");
      }
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/restaurants/${restaurant.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      <div className="space-y-4 animate-pulse max-w-2xl">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white rounded-2xl h-16 border border-slate-100" />
        ))}
      </div>
    );
  }

  if (!restaurant) {
    return <div className="text-center py-16 text-slate-400">Restaurant introuvable</div>;
  }

  const coverPreview = form.cover_image || "/hero-restaurant.png";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Informations de votre restaurant · Page publique :{" "}
          <a href={`/${restaurant.slug}`} target="_blank" className="text-orange-500 hover:underline">
            /{restaurant.slug}
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            ✅ Modifications enregistrées avec succès
          </div>
        )}

        {/* Image de couverture */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="relative h-44 w-full bg-slate-100">
            <Image
              src={coverPreview}
              alt="Bannière"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-white hover:bg-orange-50 text-slate-800 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-orange-500 rounded-full animate-spin" />
                    Upload en cours…
                  </>
                ) : (
                  <>
                    <span>📷</span>
                    {form.cover_image ? "Changer la bannière" : "Ajouter une bannière"}
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="px-5 py-3 border-t border-slate-50">
            <p className="text-xs text-slate-400">
              Image de couverture affichée sur votre page publique · Format JPG, PNG ou WebP · Recommandé : 1200×400 px
            </p>
            {uploadError && (
              <p className="text-xs text-red-500 mt-1">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400">
            Informations générales
          </h2>
          <Field label="Nom du restaurant" name="name" value={form.name ?? ""} onChange={handleChange} />
          <Field label="Slogan" name="tagline" value={form.tagline ?? ""} onChange={handleChange} placeholder="Ex : Une expérience culinaire inoubliable" />
          <FieldArea label="Description" name="description" value={form.description ?? ""} onChange={handleChange} />
          <Field label="Type de cuisine" name="cuisine" value={form.cuisine ?? ""} onChange={handleChange} placeholder="Ex : Cuisine africaine" />
        </div>

        {/* Contact & localisation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400">
            Contact & localisation
          </h2>
          <Field label="Adresse" name="address" value={form.address ?? ""} onChange={handleChange} placeholder="Ex : Abidjan, Cocody" />
          <Field label="Téléphone" name="phone" type="tel" value={form.phone ?? ""} onChange={handleChange} placeholder="+225 07 00 00 00 00" />
          <Field label="Email" name="email" type="email" value={form.email ?? ""} onChange={handleChange} placeholder="contact@monrestaurant.com" />
          <Field label="Horaires" name="hours" value={form.hours ?? ""} onChange={handleChange} placeholder="Ex : Lun-Sam : 12h-22h" />
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          {saving ? "Enregistrement…" : "Sauvegarder les modifications"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label, name, value, onChange, type = "text", placeholder,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
      />
    </div>
  );
}

function FieldArea({
  label, name, value, onChange,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        name={name} value={value} onChange={onChange} rows={3}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CURRENCIES, type Currency } from "../../lib/currency";

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
  whatsapp_number: string;
  maps_url: string;
  currency: Currency;
  has_geniuspay?: boolean;
};

async function fetchRestaurantSlug(): Promise<string> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return "";
  const data = await res.json();
  return data.restaurant?.slug ?? "";
}

export default function ParametresPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [resetting, setResetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [gpKey, setGpKey] = useState("");
  const [gpSecret, setGpSecret] = useState("");
  const [gpSaving, setGpSaving] = useState(false);
  const [gpSaved, setGpSaved] = useState(false);
  const [gpError, setGpError] = useState("");

  useEffect(() => {
    async function init() {
      const slug = await fetchRestaurantSlug();
      if (!slug) { setLoading(false); return; }
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
        whatsapp_number: data.whatsapp_number ?? "",
        maps_url: data.maps_url ?? "",
        currency: (data.currency ?? "XOF") as Currency,
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

  async function handleResetOnboarding() {
    if (!confirm("Relancer le wizard de configuration ? Vous serez redirigé vers l'onboarding.")) return;
    setResetting(true);
    await fetch("/api/onboarding/reset", { method: "POST" });
    router.push("/dashboard/onboarding");
    router.refresh();
  }

  async function handleSaveGeniusPay(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || (!gpKey.trim() && !gpSecret.trim())) return;
    setGpSaving(true);
    setGpError("");
    const res = await fetch(`/api/restaurants/${restaurant.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        geniuspay_api_key: gpKey.trim() || undefined,
        geniuspay_api_secret: gpSecret.trim() || undefined,
      }),
    });
    if (res.ok) {
      setGpSaved(true);
      setGpKey("");
      setGpSecret("");
      setRestaurant((prev) => prev ? { ...prev, has_geniuspay: true } : prev);
    } else {
      const data = await res.json();
      setGpError(data.error || "Erreur lors de la sauvegarde");
    }
    setGpSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;

    // Modèle natif : changer la devise ne convertit PAS les prix existants.
    if (form.currency && form.currency !== restaurant.currency) {
      const ok = confirm(
        "Changer la devise ne convertit PAS vos prix existants : ils seront affichés " +
        "tels quels dans la nouvelle devise. Vérifiez vos prix après le changement.\n\nContinuer ?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setError("");

    const res = await fetch(`/api/restaurants/${restaurant.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSaved(true);
      setRestaurant((prev) => prev ? { ...prev, currency: form.currency as Currency } : prev);
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
    return <div className="text-center py-16 text-green-700">Restaurant introuvable</div>;
  }

  const coverPreview = form.cover_image || "/hero-restaurant.png";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Paramètres</h1>
        <p className="text-green-700 text-sm mt-0.5">
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
            <p className="text-xs text-green-700">
              Image de couverture affichée sur votre page publique · Format JPG, PNG ou WebP · Recommandé : 1200×400 px
            </p>
            {uploadError && (
              <p className="text-xs text-red-500 mt-1">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-sm uppercase tracking-wide text-green-700">
            Informations générales
          </h2>
          <Field label="Nom du restaurant" name="name" value={form.name ?? ""} onChange={handleChange} />
          <Field label="Slogan" name="tagline" value={form.tagline ?? ""} onChange={handleChange} placeholder="Ex : Une expérience culinaire inoubliable" />
          <FieldArea label="Description" name="description" value={form.description ?? ""} onChange={handleChange} />
          <Field label="Type de cuisine" name="cuisine" value={form.cuisine ?? ""} onChange={handleChange} placeholder="Ex : Cuisine africaine" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Devise
              <span className="ml-2 text-xs font-normal text-slate-400">— affichée sur votre menu, vos commandes et reçus</span>
            </label>
            <select
              name="currency"
              value={form.currency ?? "XOF"}
              onChange={(e) => { setForm({ ...form, currency: e.target.value as Currency }); setSaved(false); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Vos prix sont saisis et affichés dans cette devise (centimes pour € et $).
              La facturation TableFlow reste en FCFA.
            </p>
          </div>
        </div>

        {/* Contact & localisation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-sm uppercase tracking-wide text-green-700">
            Contact & localisation
          </h2>
          <Field label="Adresse" name="address" value={form.address ?? ""} onChange={handleChange} placeholder="Ex : Abidjan, Cocody" />
          <Field label="Téléphone" name="phone" type="tel" value={form.phone ?? ""} onChange={handleChange} placeholder="+225 07 00 00 00 00" />
          <Field label="Email" name="email" type="email" value={form.email ?? ""} onChange={handleChange} placeholder="contact@monrestaurant.com" />
          <Field label="Horaires" name="hours" value={form.hours ?? ""} onChange={handleChange} placeholder="Ex : Lun-Sam : 12h-22h" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Numéro WhatsApp
              <span className="ml-2 text-xs font-normal text-slate-400">— recevoir les commandes par WhatsApp</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">📱</span>
              <input
                name="whatsapp_number"
                type="tel"
                value={form.whatsapp_number ?? ""}
                onChange={handleChange}
                placeholder="+225 07 00 00 00 00"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Laissez vide pour désactiver les notifications WhatsApp.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              URL Google Maps (optionnel)
              <span className="ml-2 text-xs font-normal text-slate-400">— carte précise sur votre page publique</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🗺️</span>
              <input
                name="maps_url"
                type="url"
                value={form.maps_url ?? ""}
                onChange={handleChange}
                placeholder="https://www.google.com/maps/embed?pb=…"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sur Google Maps → Partager → Intégrer une carte → copiez l&apos;URL du <code>src</code>. Laissez vide pour utiliser l&apos;adresse ci-dessus.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          {saving ? "Enregistrement…" : "Sauvegarder les modifications"}
        </button>
      </form>

      {/* Paiement GeniusPay */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wide text-green-700">
            Paiement client — GeniusPay
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Vos clients paient directement sur votre compte GeniusPay.{" "}
            <a href="https://pay.genius.ci" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
              Créer un compte GeniusPay →
            </a>
          </p>
        </div>

        {restaurant.has_geniuspay && !gpSaved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5">
            <span>✅</span>
            <span>Clés GeniusPay configurées — les paiements vont sur votre compte</span>
          </div>
        )}
        {gpSaved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5">
            <span>✅</span>
            <span>Nouvelles clés enregistrées avec succès</span>
          </div>
        )}
        {gpError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
            {gpError}
          </div>
        )}

        <form onSubmit={handleSaveGeniusPay} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              API Key (Public Key)
            </label>
            <input
              type="text"
              value={gpKey}
              onChange={(e) => { setGpKey(e.target.value); setGpSaved(false); }}
              placeholder={restaurant.has_geniuspay ? "pk_live_••••••••••• (laisser vide pour conserver)" : "pk_live_xxxxxxxxxxxxxxx"}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              API Secret (Private Key)
            </label>
            <input
              type="password"
              value={gpSecret}
              onChange={(e) => { setGpSecret(e.target.value); setGpSaved(false); }}
              placeholder={restaurant.has_geniuspay ? "sk_live_••••••••••• (laisser vide pour conserver)" : "sk_live_xxxxxxxxxxxxxxx"}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={gpSaving || (!gpKey.trim() && !gpSecret.trim())}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {gpSaving ? "Enregistrement…" : "Enregistrer les clés GeniusPay"}
          </button>
        </form>
      </div>

      {/* Relancer l'onboarding */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400">Configuration initiale</h2>
        <p className="text-sm text-slate-500">
          Besoin de refaire la configuration de départ ? Le wizard vous guidera à nouveau à travers les 3 étapes.
        </p>
        <button
          type="button"
          onClick={handleResetOnboarding}
          disabled={resetting}
          className="w-full border border-slate-200 hover:border-orange-300 text-slate-600 hover:text-orange-600 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {resetting ? "Redirection…" : "Relancer le wizard de configuration"}
        </button>
      </div>
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

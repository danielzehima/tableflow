"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const QRCodeCanvas = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeCanvas),
  { ssr: false, loading: () => <div className="w-[200px] h-[200px] bg-slate-100 rounded-xl animate-pulse" /> }
);

type DishForm = { name: string; price: string };

const CUISINES = ["Africaine", "Française", "Italienne", "Asiatique", "Libanaise", "Fast-food", "Américaine", "Autre"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s < step ? "bg-orange-500 text-white" :
              s === step ? "bg-orange-500 text-white ring-4 ring-orange-100" :
              "bg-slate-100 text-slate-400"
            }`}>
              {s < step ? "✓" : s}
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${s === step ? "text-orange-500" : "text-slate-400"}`}>
              {s === 1 ? "Informations" : s === 2 ? "Menu" : "QR Code"}
            </span>
            {s < 3 && <div className={`h-0.5 w-12 sm:w-24 ml-1.5 ${s < step ? "bg-orange-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 mt-1">Étape {step}/3</div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const [form1, setForm1] = useState({
    name: "", description: "", phone: "", address: "", cuisine: "",
  });

  const [categoryName, setCategoryName] = useState("Nos plats");
  const [dishes, setDishes] = useState<DishForm[]>([{ name: "", price: "" }]);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/restaurant");
        if (!res.ok) { setLoading(false); return; }
        const r = await res.json();
        setRestaurantId(r.id);
        setRestaurantSlug(r.slug);
        setQrUrl(`${window.location.origin}/${r.slug}`);

        const detail = await fetch(`/api/restaurants/${r.slug}`);
        if (detail.ok) {
          const d = await detail.json();
          setForm1({
            name: d.name ?? "",
            description: d.description ?? "",
            phone: d.phone ?? "",
            address: d.address ?? "",
            cuisine: d.cuisine ?? "",
          });
        }
      } catch {
        // ignore — page still works with empty defaults
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function saveStep1() {
    if (!form1.name.trim()) { setError("Le nom du restaurant est obligatoire"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/restaurants/${restaurantSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form1.name,
          description: form1.description,
          phone: form1.phone,
          address: form1.address,
          cuisine: form1.cuisine,
        }),
      });
      if (!res.ok) { setError("Erreur lors de la sauvegarde"); return; }
      setStep(2);
    } catch {
      setError("Erreur de connexion — vérifiez votre réseau");
    } finally {
      setSaving(false);
    }
  }

  async function saveStep2() {
    setSaving(true);
    setError("");
    try {
      const validDishes = dishes.filter((d) => d.name.trim() && d.price.trim());
      if (validDishes.length > 0) {
        const catRes = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurant_id: restaurantId, name: categoryName }),
        });
        if (catRes.ok) {
          const cat = await catRes.json();
          await Promise.all(
            validDishes.map((d) =>
              fetch("/api/menu/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: cat.id, name: d.name, price: Number(d.price) }),
              })
            )
          );
        }
      }
    } catch {
      // ignore — step 3 shows regardless
    } finally {
      setSaving(false);
      setStep(3);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    router.push("/dashboard");
    router.refresh();
  }

  function downloadQR() {
    const canvas = document.getElementById("onboarding-qr") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-${restaurantSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function addDish() {
    if (dishes.length < 3) setDishes((prev) => [...prev, { name: "", price: "" }]);
  }

  function updateDish(i: number, field: keyof DishForm, value: string) {
    setDishes((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-slate-900">TableFlow</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-slate-500 text-sm">Configuration de votre restaurant</span>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-8">
          <div className="w-full max-w-xl space-y-6">
            <ProgressBar step={step} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* ── ÉTAPE 1 ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Votre restaurant</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Ces informations apparaîtront sur votre page publique.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom du restaurant <span className="text-red-400">*</span></label>
                    <input
                      value={form1.name}
                      onChange={(e) => setForm1({ ...form1, name: e.target.value })}
                      placeholder="Le Bistro de Paris"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de cuisine</label>
                    <select
                      value={form1.cuisine}
                      onChange={(e) => setForm1({ ...form1, cuisine: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Sélectionner…</option>
                      {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                    <textarea
                      value={form1.description}
                      onChange={(e) => setForm1({ ...form1, description: e.target.value })}
                      placeholder="Un restaurant chaleureux au cœur de la ville…"
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
                      <input
                        value={form1.phone}
                        onChange={(e) => setForm1({ ...form1, phone: e.target.value })}
                        placeholder="+225 07 00 00 00"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse</label>
                      <input
                        value={form1.address}
                        onChange={(e) => setForm1({ ...form1, address: e.target.value })}
                        placeholder="Abidjan, Cocody…"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveStep1}
                  disabled={saving}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  {saving ? "Enregistrement…" : "Suivant →"}
                </button>
              </div>
            )}

            {/* ── ÉTAPE 2 ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Ajoutez vos premiers plats</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Vous pourrez en ajouter autant que vous voulez ensuite.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom de la catégorie</label>
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Nos plats, Entrées, Boissons…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="space-y-3">
                  {dishes.map((dish, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-xs font-bold text-orange-600 shrink-0 mt-3">
                        {i + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          value={dish.name}
                          onChange={(e) => updateDish(i, "name", e.target.value)}
                          placeholder="Nom du plat"
                          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={dish.price}
                          onChange={(e) => updateDish(i, "price", e.target.value)}
                          placeholder="Prix (FCFA)"
                          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {dishes.length < 3 && (
                  <button
                    type="button"
                    onClick={addDish}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-orange-300 text-slate-400 hover:text-orange-500 text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    + Ajouter un autre plat
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 border border-slate-200 text-slate-500 hover:text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors"
                  >
                    Passer cette étape
                  </button>
                  <button
                    type="button"
                    onClick={saveStep2}
                    disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    {saving ? "Enregistrement…" : "Suivant →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 3 ── */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h2 className="text-xl font-extrabold text-slate-900">Votre QR Code est prêt !</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Imprimez-le et posez-le sur vos tables. Vos clients scannent et commandent directement.
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm inline-block">
                    {qrUrl && (
                      <QRCodeCanvas
                        id="onboarding-qr"
                        value={qrUrl}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#1e293b"
                        level="H"
                      />
                    )}
                  </div>
                </div>

                {qrUrl && (
                  <p className="text-center text-xs text-slate-400 font-mono break-all">{qrUrl}</p>
                )}

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={downloadQR}
                    className="w-full border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger le QR Code
                  </button>

                  <a
                    href={`/${restaurantSlug}`}
                    target="_blank"
                    className="w-full border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Voir ma page menu
                  </a>

                  <button
                    type="button"
                    onClick={finish}
                    disabled={saving}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? "Chargement…" : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Accéder au dashboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

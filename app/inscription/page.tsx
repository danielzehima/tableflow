"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const plans = ["Starter — 29€/mois", "Pro — 79€/mois", "Business — 199€/mois"];

export default function InscriptionPage() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    restaurant: "",
    email: "",
    phone: "",
    plan: plans[1],
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        return;
      }

      // Enregistre le slug dans un cookie persistant (1 an)
      document.cookie = `restaurant_slug=${data.slug}; path=/; max-age=31536000; SameSite=Lax`;
      setDone(true);
    } catch {
      setError("Erreur de connexion, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-8">
            <span className="text-orange-500 font-semibold text-xs uppercase tracking-widest">
              Inscription
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-2">
              14 jours gratuits
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Sans carte bancaire · Annulation à tout moment
            </p>
          </div>

          {done ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Bienvenue sur TableFlow !
              </h2>
              <p className="text-slate-500 mb-2 text-sm">
                Votre restaurant a été créé avec succès.
              </p>
              <p className="text-slate-400 text-xs mb-6">
                Email de confirmation envoyé à{" "}
                <span className="font-semibold text-slate-600">{form.email}</span>.
              </p>
              <button
                onClick={() => {
                  window.location.href = "/dashboard";
                }}
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm cursor-pointer"
              >
                Accéder au tableau de bord →
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5"
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom de votre restaurant
                </label>
                <input
                  name="restaurant"
                  value={form.restaurant}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="Ex : Le Palmier d'Or"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Adresse email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="vous@votrerestaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Numéro de téléphone
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Plan souhaité
                </label>
                <select
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition bg-white disabled:opacity-50"
                >
                  {plans.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {loading ? "Création en cours…" : "Démarrer mon essai gratuit →"}
              </button>

              <p className="text-center text-xs text-slate-400">
                En vous inscrivant, vous acceptez nos{" "}
                <a
                  href="/mentions-legales"
                  className="underline hover:text-orange-500"
                >
                  conditions d&apos;utilisation
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

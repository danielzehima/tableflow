"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function InscriptionPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    restaurant: "", ownerName: "", email: "", phone: "", password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      if (!res.ok) { setError(data.error || "Erreur lors de l'inscription"); return; }

      // Auto-login après inscription
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (loginRes.ok) {
        router.push("/dashboard");
        return;
      }
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
            <span className="text-orange-500 font-semibold text-xs uppercase tracking-widest">Inscription</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-2">14 jours gratuits</h1>
            <p className="text-slate-500 text-sm md:text-base">Sans carte bancaire · Annulation à tout moment</p>
          </div>

          {done ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Bienvenue sur TableFlow !</h2>
              <p className="text-slate-500 mb-2 text-sm">Votre restaurant a été créé avec succès.</p>
              <p className="text-slate-400 text-xs mb-6">
                Connectez-vous avec <span className="font-semibold text-slate-600">{form.email}</span> et votre mot de passe.
              </p>
              <a href="/login" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Accéder au tableau de bord →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du restaurant</label>
                <input name="restaurant" value={form.restaurant} onChange={handleChange} required disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="Ex : Le Palmier d'Or" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Votre nom complet</label>
                <input name="ownerName" value={form.ownerName} onChange={handleChange} required disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="Ex : Koné Amadou" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="vous@votrerestaurant.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} disabled={loading}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                  placeholder="+225 07 00 00 00 00" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input name="password" type={showPwd ? "text" : "password"} value={form.password} onChange={handleChange}
                    required minLength={8} disabled={loading}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-50"
                    placeholder="Minimum 8 caractères" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors">
                {loading ? "Création en cours…" : "Démarrer mon essai gratuit →"}
              </button>

              <p className="text-center text-xs text-slate-400">
                Déjà inscrit ?{" "}
                <a href="/login" className="text-orange-500 hover:underline font-medium">Se connecter</a>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

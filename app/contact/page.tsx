"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-slate-50">
        <div className="max-w-xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-8 md:mb-10">
            <span className="text-orange-500 font-semibold text-xs uppercase tracking-widest">
              Support
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-2">
              Contactez-nous
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Notre équipe vous répond sous 24h ouvrées.
            </p>
          </div>

          {sent ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Message envoyé !
              </h2>
              <p className="text-slate-500 mb-6">
                Merci, nous vous répondrons très prochainement.
              </p>
              <a
                href="/"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Retour à l&apos;accueil
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom complet
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  placeholder="Votre nom"
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  placeholder="vous@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Envoyer le message
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

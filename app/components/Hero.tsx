"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const stats = [
  { value: "+2 000", label: "Restaurants actifs" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "5 min", label: "Pour être en ligne" },
  { value: "24/7", label: "Support inclus" },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden text-white">
      {/* Image de fond */}
      <Image
        src="/hero-restaurant.png"
        alt="Ambiance restaurant"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/65 to-slate-900/75" />

      {/* Halos décoratifs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 md:w-[600px] h-96 md:h-[600px] bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-amber-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 py-24 md:py-28">
        {/* Layout 2 colonnes (desktop) / 1 colonne (mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">

          {/* ===== Colonne gauche : texte + CTA ===== */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-400/30 text-orange-300 text-xs md:text-sm font-medium px-4 md:px-5 py-2 rounded-full mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shrink-0" />
              La solution n°1 pour les restaurateurs
            </div>

            {/* Titre */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight mb-5 md:mb-6 drop-shadow-lg">
              TableFlow :{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                Libérez le potentiel
              </span>{" "}
              de votre restaurant avec une gestion 100% digitale.
            </h1>

            {/* Sous-titre */}
            <p className="text-base md:text-lg lg:text-xl text-white/80 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow">
              Menus, réservations, commandes en ligne, paiements et statistiques —
              tout est centralisé dans un seul tableau de bord ultra-simple.
              Lancez votre restaurant en ligne en moins de&nbsp;5&nbsp;minutes.
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 md:gap-4">
              <a
                href="/inscription"
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 md:px-8 py-3.5 md:py-4 rounded-xl text-base md:text-lg transition-all hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
              >
                Démarrer gratuitement →
              </a>
              <a
                href="/demo"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold px-6 md:px-8 py-3.5 md:py-4 rounded-xl text-base md:text-lg border border-white/30 backdrop-blur-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>▶</span> Voir la démo
              </a>
            </div>

            {/* Rassurance */}
            <p className="mt-6 text-white/50 text-xs md:text-sm tracking-wide">
              ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 14 jours d&apos;essai gratuit
              &nbsp;·&nbsp; ✓ Annulation à tout moment
            </p>
          </div>

          {/* ===== Colonne droite : mock-up de commande ===== */}
          <div
            className={`relative w-full max-w-md mx-auto lg:max-w-none lg:mx-0 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Halo orange derrière */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500/30 via-amber-400/20 to-transparent blur-2xl rounded-3xl" />

            {/* Carte mock-up */}
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-black/60 ring-1 ring-white/10 overflow-hidden rotate-0 lg:rotate-1 hover:rotate-0 transition-transform duration-500">
              {/* Barre de fenêtre */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-200 bg-slate-50">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] text-slate-400 font-medium">
                  tableflow.app / commande #2847
                </span>
              </div>

              {/* Contenu commande */}
              <div className="p-5 md:p-6 text-slate-900">
                {/* En-tête */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                      Nouvelle commande
                    </div>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                      Table&nbsp;7 · Service midi
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                    PAYÉE
                  </span>
                </div>

                {/* Items */}
                <ul className="space-y-2.5 mb-4">
                  {[
                    { qty: 2, name: "Attiéké poisson braisé", price: "7 000" },
                    { qty: 1, name: "Poulet kédjénou", price: "5 500" },
                    { qty: 3, name: "Bissap maison", price: "3 000" },
                  ].map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className="inline-flex w-6 h-6 rounded-md bg-orange-100 text-orange-600 font-bold text-xs items-center justify-center">
                          {item.qty}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.price}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Total */}
                <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Total
                  </span>
                  <span className="text-xl font-extrabold text-slate-900">
                    15 500{" "}
                    <span className="text-xs text-slate-500 font-medium">FCFA</span>
                  </span>
                </div>

                {/* Notification */}
                <div className="mt-4 flex items-center gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                  <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    ✓
                  </span>
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold">Cuisine notifiée</span>
                    <span className="text-slate-500"> · il y a 2 sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini carte flottante (desktop only) */}
            <div className="hidden lg:flex absolute -bottom-6 -left-6 items-center gap-2.5 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-xs">
                <div className="font-bold text-white">+ 12 commandes</div>
                <div className="text-white/60">cette heure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-14 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
              className={`text-center bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl py-4 md:py-6 px-3 md:px-4 transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="text-2xl md:text-3xl font-extrabold text-orange-400 drop-shadow">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

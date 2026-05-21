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
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-400/30 text-orange-300 text-xs md:text-sm font-medium px-4 md:px-5 py-2 rounded-full mb-6 md:mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shrink-0" />
            La solution n°1 pour les restaurateurs
          </div>

          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-5 md:mb-6 drop-shadow-lg">
            Votre restaurant,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              piloté sans friction
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-base md:text-xl text-white/80 mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow">
            TableFlow centralise vos menus, réservations, commandes et analytics
            dans un seul tableau de bord. Ouvrez votre restaurant en ligne en
            moins de&nbsp;5&nbsp;minutes.
          </p>

          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
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
          <p className="mt-6 md:mt-8 text-white/50 text-xs md:text-sm tracking-wide">
            ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 14 jours d&apos;essai gratuit
            &nbsp;·&nbsp; ✓ Annulation à tout moment
          </p>
        </div>

        {/* Stats */}
        <div className="mt-12 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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

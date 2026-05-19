const stats = [
  { value: "+2 000", label: "Restaurants actifs" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "5 min", label: "Pour être en ligne" },
  { value: "24/7", label: "Support inclus" },
];

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            La solution n°1 pour les restaurateurs
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Votre restaurant,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              piloté sans friction
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
            TableFlow centralise vos menus, réservations, commandes et
            analytics dans un seul tableau de bord. Ouvrez votre restaurant
            en ligne en moins de 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#"
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              Démarrer gratuitement →
            </a>
            <a
              href="#"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg border border-white/20 transition-all"
            >
              Voir une démo
            </a>
          </div>

          <p className="mt-8 text-slate-400 text-sm">
            ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 14 jours d&apos;essai
            gratuit &nbsp;·&nbsp; ✓ Annulation à tout moment
          </p>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-orange-400">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

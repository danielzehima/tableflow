const features = [
  {
    icon: "📋",
    title: "Menu Digital",
    description:
      "Créez et mettez à jour votre menu en temps réel. Photos, descriptions, allergènes, disponibilités — tout géré depuis votre dashboard.",
  },
  {
    icon: "📅",
    title: "Réservations en ligne",
    description:
      "Vos clients réservent leur table directement depuis votre page publique. Confirmations automatiques par SMS et email.",
  },
  {
    icon: "📊",
    title: "Analytics & Revenus",
    description:
      "Visualisez vos plats les plus vendus, les heures de pointe et l'évolution de votre chiffre d'affaires en un coup d'œil.",
  },
  {
    icon: "🌐",
    title: "Page publique incluse",
    description:
      "Chaque restaurant obtient sa propre page en ligne personnalisée, accessible depuis n'importe quel appareil.",
  },
  {
    icon: "🛎️",
    title: "Gestion des commandes",
    description:
      "Recevez et gérez les commandes en salle ou à emporter. Notifications en temps réel pour votre équipe en cuisine.",
  },
  {
    icon: "👥",
    title: "Multi-établissements",
    description:
      "Gérez plusieurs restaurants depuis un seul compte. Idéal pour les groupes et les franchises.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest">
            Fonctionnalités
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-3 mb-4">
            Tout ce dont vous avez besoin,{" "}
            <span className="text-orange-500">rien de superflu</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Conçu spécifiquement pour les restaurateurs. Pas de configuration
            compliquée, juste des outils qui fonctionnent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300 bg-white"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

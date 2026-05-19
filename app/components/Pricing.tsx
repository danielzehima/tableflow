const plans = [
  {
    name: "Starter",
    price: "29",
    description: "Pour démarrer votre présence en ligne",
    borderColor: "border-slate-200",
    highlight: false,
    badge: null,
    features: [
      "1 établissement",
      "Menu digital illimité",
      "Page publique personnalisée",
      "Réservations en ligne",
      "Support par email",
    ],
    cta: "Commencer",
    href: "/inscription",
    ctaStyle: "border-2 border-orange-500 text-orange-500 hover:bg-orange-50",
  },
  {
    name: "Pro",
    price: "79",
    description: "La solution complète pour les restaurants actifs",
    borderColor: "border-orange-500",
    highlight: true,
    badge: "Le plus populaire",
    features: [
      "3 établissements",
      "Tout Starter, plus :",
      "Gestion des commandes",
      "Analytics avancés",
      "Notifications SMS / email",
      "Support prioritaire 24/7",
    ],
    cta: "Démarrer l'essai gratuit",
    href: "/inscription",
    ctaStyle: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  {
    name: "Business",
    price: "199",
    description: "Pour les groupes et les franchises",
    borderColor: "border-slate-200",
    highlight: false,
    badge: null,
    features: [
      "Établissements illimités",
      "Tout Pro, plus :",
      "API & intégrations",
      "Gestionnaire de compte dédié",
      "Formation de l'équipe",
      "SLA garanti 99,9 %",
    ],
    cta: "Nous contacter",
    href: "/contact",
    ctaStyle: "border-2 border-slate-300 text-slate-700 hover:bg-slate-50",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 px-4 md:px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-orange-500 font-semibold text-xs md:text-sm uppercase tracking-widest">
            Tarifs
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mt-3 mb-4">
            Un prix transparent,{" "}
            <span className="text-orange-500">sans surprise</span>
          </h2>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto">
            14 jours d&apos;essai gratuit sur tous les plans. Aucune carte
            bancaire requise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border-2 ${plan.borderColor} p-6 md:p-8 ${
                plan.highlight
                  ? "shadow-2xl shadow-orange-100 md:scale-105"
                  : "shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-5 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="flex items-end gap-1 mb-5 md:mb-6">
                <span className="text-4xl md:text-5xl font-extrabold text-slate-900">
                  {plan.price}€
                </span>
                <span className="text-slate-400 mb-2">/mois</span>
              </div>

              <a
                href={plan.href}
                className={`block w-full text-center font-semibold py-3 rounded-xl transition-all text-sm ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>

              <ul className="mt-6 md:mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <span className="text-orange-500 font-bold mt-0.5 shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { supabase } from "../lib/supabase-server";

type PlanSetting = {
  plan: string;
  label: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  highlight: boolean;
  badge: string | null;
  cta_text: string;
  cta_href: string;
};

const FALLBACK: PlanSetting[] = [
  {
    plan: "starter", label: "Starter", price: 9900, currency: "FCFA",
    description: "Pour démarrer votre présence en ligne",
    features: ["Page publique", "Menu en ligne", "Réservations en ligne", "Support par email"],
    highlight: false, badge: null, cta_text: "Commencer", cta_href: "/inscription",
  },
  {
    plan: "pro", label: "Pro", price: 24900, currency: "FCFA",
    description: "La solution complète pour les restaurants actifs",
    features: ["Tout Starter", "Commandes en ligne", "Stats avancées", "Support prioritaire"],
    highlight: true, badge: "Le plus populaire", cta_text: "Démarrer l'essai gratuit", cta_href: "/inscription",
  },
];

export default async function Pricing() {
  const { data } = await supabase
    .from("plan_settings")
    .select("plan, label, price, currency, description, features, highlight, badge, cta_text, cta_href")
    .order("sort_order");

  const plans: PlanSetting[] = data && data.length > 0 ? data : FALLBACK;

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
              key={plan.plan}
              className={`relative bg-white rounded-2xl border-2 p-6 md:p-8 ${
                plan.highlight
                  ? "border-orange-500 shadow-2xl shadow-orange-100 md:scale-105"
                  : "border-slate-200 shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-5 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">{plan.label}</h3>
                <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="flex items-end gap-1 mb-5 md:mb-6">
                {plan.price === 0 ? (
                  <span className="text-4xl md:text-5xl font-extrabold text-slate-900">Gratuit</span>
                ) : (
                  <>
                    <span className="text-4xl md:text-5xl font-extrabold text-slate-900">
                      {plan.price.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-slate-400 mb-2 ml-0.5">{plan.currency}/mois</span>
                  </>
                )}
              </div>

              <a
                href={plan.cta_href}
                className={`block w-full text-center font-semibold py-3 rounded-xl transition-all text-sm ${
                  plan.highlight
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "border-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                }`}
              >
                {plan.cta_text}
              </a>

              <ul className="mt-6 md:mt-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
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

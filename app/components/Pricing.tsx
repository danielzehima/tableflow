import { supabase } from "../lib/supabase-server";
import PricingCards from "./PricingCards";

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

        <PricingCards plans={plans} />
      </div>
    </section>
  );
}

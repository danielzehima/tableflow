import { supabase } from "../lib/supabase-server";
import PricingCards from "./PricingCards";

import type { PlanSetting } from "./PricingCards";

// ── Fallback synchronisé avec plan-utils.ts ──────────────────────
const FALLBACK: PlanSetting[] = [
  {
    plan: "free", label: "Gratuit", price: 0, price_yearly: 0, currency: "FCFA",
    description: "Testez TableFlow sans engagement, 14 jours en accès complet",
    features: ["14 jours d'essai gratuit — accès complet", "Page publique du restaurant", "Menu en ligne avec photos", "5 réservations / mois", "QR code de table basique"],
    highlight: false, badge: null, cta_text: "Commencer gratuitement", cta_href: "/inscription",
  },
  {
    plan: "starter", label: "Starter", price: 9900, price_yearly: 118800, currency: "FCFA",
    description: "Tout ce qu'il faut pour digitaliser votre restaurant",
    features: ["Tout du plan Gratuit", "Réservations illimitées", "Commandes en ligne", "Tables & QR codes illimités", "Heures creuses & réductions auto", "Codes promo", "Avis clients & note publique", "Analytics & statistiques", "Messagerie visiteurs en temps réel", "Événements & agenda", "Personnalisation (couleurs, logo)", "Support par email"],
    highlight: false, badge: null, cta_text: "Démarrer l'essai gratuit", cta_href: "/inscription",
  },
  {
    plan: "pro", label: "Pro", price: 24900, price_yearly: 238080, currency: "FCFA",
    description: "La solution complète pour les restaurants ambitieux",
    features: ["Tout du plan Starter", "Programme de fidélité clients", "Newsletter & campagnes email", "Gestion d'équipe multi-rôles", "Accès serveur & cuisinier dédié", "Support prioritaire"],
    highlight: true, badge: "Le plus populaire", cta_text: "Démarrer l'essai gratuit", cta_href: "/inscription",
  },
];

export default async function Pricing() {
  let plans: PlanSetting[] = FALLBACK;

  try {
    const { data, error } = await supabase
      .from("plan_settings")
      .select("plan, label, price, price_yearly, currency, description, features, highlight, badge, cta_text, cta_href")
      .order("sort_order");

    if (!error && data && data.length > 0) {
      plans = data as PlanSetting[];
    }
  } catch {
    // Supabase injoignable (réseau, build, env vars) → on affiche le FALLBACK
  }

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

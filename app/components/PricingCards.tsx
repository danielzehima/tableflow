"use client";

import { useEffect, useRef, useState } from "react";

export type PlanSetting = {
  plan: string;
  label: string;
  price: number;
  price_yearly: number;
  currency: string;
  description: string;
  features: string[];
  highlight: boolean;
  badge: string | null;
  cta_text: string;
  cta_href: string;
};

type Billing = "monthly" | "yearly";

// ── Icônes par mot-clé ────────────────────────────────────────────────────────
function featureIcon(feature: string): string {
  const f = feature.toLowerCase();
  if (f.includes("essai"))          return "🎁";
  if (f.includes("page publique"))  return "🌐";
  if (f.includes("menu"))           return "📋";
  if (f.includes("réservation"))    return "📅";
  if (f.includes("qr"))             return "📱";
  if (f.includes("commande"))       return "🛎️";
  if (f.includes("heure") || f.includes("réduction")) return "🔥";
  if (f.includes("promo"))          return "🏷️";
  if (f.includes("avis"))           return "⭐";
  if (f.includes("analytic") || f.includes("stat")) return "📊";
  if (f.includes("message"))        return "💬";
  if (f.includes("événement"))      return "🎉";
  if (f.includes("personnali"))     return "🎨";
  if (f.includes("fidélité"))       return "🎖️";
  if (f.includes("newsletter") || f.includes("email")) return "📧";
  if (f.includes("équipe") || f.includes("multi")) return "👥";
  if (f.includes("serveur") || f.includes("cuisinier")) return "🍽️";
  if (f.includes("support prioritaire")) return "🚀";
  if (f.includes("support"))        return "📩";
  if (f.includes("tout du"))        return "✅";
  return "✓";
}

function isInheritLine(feature: string): boolean {
  return feature.toLowerCase().startsWith("tout du");
}

// ── Toggle Mensuel / Annuel ───────────────────────────────────────────────────
function BillingToggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  const isYearly = billing === "yearly";
  return (
    <div className="flex items-center justify-center gap-4 mb-10 md:mb-14">
      <button
        onClick={() => onChange("monthly")}
        className={`text-sm font-semibold transition-colors ${!isYearly ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
      >
        Mensuel
      </button>

      {/* Switch */}
      <button
        onClick={() => onChange(isYearly ? "monthly" : "yearly")}
        aria-label="Basculer mensuel / annuel"
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
          isYearly ? "bg-orange-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
            isYearly ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange("yearly")}
          className={`text-sm font-semibold transition-colors ${isYearly ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
        >
          Annuel
        </button>
        {/* Badge économies */}
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full transition-all duration-300 ${
          isYearly
            ? "bg-emerald-100 text-emerald-700 opacity-100 scale-100"
            : "opacity-0 scale-75 pointer-events-none"
        }`}>
          Jusqu&apos;à&nbsp;−20&nbsp;%
        </span>
      </div>
    </div>
  );
}

// ── Carte ─────────────────────────────────────────────────────────────────────
function PricingCard({ plan, billing, index }: { plan: PlanSetting; billing: Billing; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isPro  = plan.plan === "pro";
  const isFree = plan.plan === "free";
  const isPaid = plan.price > 0;

  // ── Calcul du prix affiché ──────────────────────────────────────────────────
  const isYearly       = billing === "yearly" && isPaid;
  // Prix mensuel équivalent en annuel
  const monthlyEquiv   = isYearly && plan.price_yearly > 0
    ? Math.round(plan.price_yearly / 12)
    : plan.price;
  // Économies annuelles vs mensuel × 12
  const yearlySavings  = isPaid && isYearly && plan.price_yearly > 0
    ? plan.price * 12 - plan.price_yearly
    : 0;
  // Discount en % arrondi
  const discountPct    = isPaid && plan.price > 0 && plan.price_yearly > 0
    ? Math.round((1 - plan.price_yearly / (plan.price * 12)) * 100)
    : 0;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={`relative flex flex-col rounded-2xl border-2 transition-all duration-500 overflow-hidden
        ${plan.highlight
          ? "border-orange-500 shadow-2xl shadow-orange-100 md:scale-105"
          : "border-slate-200 shadow-sm bg-white"}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {/* Badge "populaire" DB */}
      {plan.badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[11px] font-extrabold px-5 py-1.5 rounded-b-xl whitespace-nowrap tracking-wide shadow-md">
          {plan.badge}
        </div>
      )}

      {/* Badge économies annuelles — Pro uniquement, visible en mode annuel */}
      {isPro && isYearly && discountPct > 0 && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
          −{discountPct}&nbsp;%
        </div>
      )}

      {/* En-tête */}
      <div className={`px-6 md:px-8 pt-8 md:pt-10 pb-6 ${isPro ? "bg-slate-900" : isFree ? "bg-slate-50" : "bg-white"}`}>
        {/* Label + description */}
        <div className="mb-5">
          <span className={`text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full
            ${isPro ? "bg-orange-500/20 text-orange-400"
              : isFree ? "bg-slate-200 text-slate-500"
              : "bg-blue-50 text-blue-600"}`}>
            {plan.label}
          </span>
          <p className={`text-sm mt-3 leading-relaxed ${isPro ? "text-slate-400" : "text-slate-500"}`}>
            {plan.description}
          </p>
        </div>

        {/* Prix */}
        <div className="mb-6">
          {!isPaid ? (
            <span className={`text-4xl md:text-5xl font-extrabold ${isPro ? "text-white" : "text-slate-900"}`}>
              Gratuit
            </span>
          ) : (
            <>
              <div className="flex items-end gap-1.5">
                <span className={`text-4xl md:text-5xl font-extrabold transition-all duration-300 ${isPro ? "text-white" : "text-slate-900"}`}>
                  {monthlyEquiv.toLocaleString("fr-FR")}
                </span>
                <div className="mb-2">
                  <span className={`text-sm font-semibold ${isPro ? "text-slate-400" : "text-slate-400"}`}>
                    {plan.currency}
                  </span>
                  <span className={`block text-xs ${isPro ? "text-slate-500" : "text-slate-400"}`}>/mois</span>
                </div>
              </div>

              {/* Sous-texte facturation */}
              <div className="mt-1 min-h-[18px]">
                {isYearly ? (
                  <p className={`text-xs ${isPro ? "text-slate-500" : "text-slate-400"}`}>
                    Facturé {plan.price_yearly.toLocaleString("fr-FR")} {plan.currency}/an
                    {yearlySavings > 0 && (
                      <span className="ml-1.5 text-emerald-500 font-semibold">
                        (économisez {yearlySavings.toLocaleString("fr-FR")} {plan.currency})
                      </span>
                    )}
                  </p>
                ) : (
                  <p className={`text-xs ${isPro ? "text-slate-500" : "text-slate-400"}`}>
                    Facturé chaque mois
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <a
          href={plan.cta_href}
          className={`flex items-center justify-center gap-2 w-full text-center font-bold py-3.5 rounded-xl transition-all text-sm
            ${isPro
              ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/30"
              : plan.highlight
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "border-2 border-orange-500 text-orange-500 hover:bg-orange-50"}`}
        >
          {plan.cta_text}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>

        {isPaid && (
          <p className={`text-center text-[11px] mt-2.5 ${isPro ? "text-slate-500" : "text-slate-400"}`}>
            🎁 14 jours d&apos;essai gratuit inclus
          </p>
        )}
      </div>

      {/* Séparateur */}
      <div className={`h-px mx-6 ${isPro ? "bg-slate-800" : "bg-slate-100"}`} />

      {/* Fonctionnalités */}
      <div className={`flex-1 px-6 md:px-8 py-6 ${isPro ? "bg-slate-900" : "bg-white"}`}>
        <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-4 ${isPro ? "text-slate-500" : "text-slate-400"}`}>
          Ce qui est inclus
        </p>
        <ul className="space-y-3">
          {plan.features.map((feature, i) => {
            const inherit = isInheritLine(feature);
            const icon    = featureIcon(feature);
            return (
              <li key={i} className={`flex items-start gap-3 text-sm
                ${inherit
                  ? isPro ? "text-orange-400 font-semibold" : "text-orange-600 font-semibold"
                  : isPro ? "text-slate-300" : "text-slate-600"}`}
              >
                <span className={`shrink-0 mt-0.5 text-base leading-none ${inherit ? "" : "opacity-80"}`}>
                  {icon === "✓"
                    ? <svg className={`w-4 h-4 mt-0.5 ${isPro ? "text-orange-400" : "text-orange-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : icon
                  }
                </span>
                <span className="leading-snug">{feature}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── Export principal — toggle + grille ────────────────────────────────────────
export default function PricingCards({ plans }: { plans: PlanSetting[] }) {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <>
      <BillingToggle billing={billing} onChange={setBilling} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
        {plans.map((plan, i) => (
          <PricingCard key={plan.plan} plan={plan} billing={billing} index={i} />
        ))}
      </div>
    </>
  );
}

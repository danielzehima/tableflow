"use client";
import { useEffect, useRef, useState } from "react";

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

function PricingCard({ plan, index }: { plan: PlanSetting; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={`relative bg-white rounded-2xl border-2 p-6 md:p-8 transition-all duration-600 ${
        plan.highlight
          ? "border-orange-500 shadow-2xl shadow-orange-100 md:scale-105"
          : "border-slate-200 shadow-sm"
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
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
  );
}

export default function PricingCards({ plans }: { plans: PlanSetting[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
      {plans.map((plan, i) => (
        <PricingCard key={plan.plan} plan={plan} index={i} />
      ))}
    </div>
  );
}

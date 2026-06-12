"use client";

import Link from "next/link";
import { usePlan } from "./PlanContext";

type Props = {
  /** Libellé de la fonctionnalité bloquée (ex : "Newsletter") */
  feature: string;
  /** Plans autorisés. Par défaut ["starter","pro"] */
  requiredPlans?: Array<"starter" | "pro">;
  children: React.ReactNode;
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro:     "Pro",
};

export default function PlanGate({
  feature,
  requiredPlans = ["starter", "pro"],
  children,
}: Props) {
  const { effectivePlan } = usePlan();

  // Trial et Pro ont toujours accès à tout
  const hasAccess =
    effectivePlan === "trial" ||
    requiredPlans.includes(effectivePlan as "starter" | "pro");

  if (hasAccess) return <>{children}</>;

  // Détermination du plan minimum requis
  const minPlan = requiredPlans.includes("starter") ? "starter" : "pro";
  const minLabel = PLAN_LABELS[minPlan];

  return (
    <div className="relative min-h-[260px]">
      {/* Contenu flouté */}
      <div className="pointer-events-none opacity-25 select-none blur-[3px] saturate-0">
        {children}
      </div>

      {/* Overlay de verrouillage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl px-8 py-7 text-center max-w-sm mx-4">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">{feature}</h3>
          <p className="text-slate-500 text-sm mb-5 leading-relaxed">
            Cette fonctionnalité est disponible à partir du plan{" "}
            <span className="font-bold text-orange-600">{minLabel}</span>.
            Passez à la version supérieure pour en profiter.
          </p>
          <Link
            href="/dashboard/abonnement?reason=upgrade_required"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Voir les plans
          </Link>
        </div>
      </div>
    </div>
  );
}

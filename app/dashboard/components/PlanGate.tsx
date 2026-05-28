"use client";

import Link from "next/link";

type Props = {
  plan: string | null | undefined;
  requiredPlans?: string[];
  feature: string;
  children: React.ReactNode;
};

export default function PlanGate({ plan, requiredPlans = ["starter", "pro"], feature, children }: Props) {
  const hasAccess = requiredPlans.includes(plan ?? "free");
  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 select-none blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl px-8 py-6 text-center max-w-sm mx-4">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="font-bold text-slate-900 text-base mb-1">{feature}</h3>
          <p className="text-slate-500 text-sm mb-4">
            Cette fonctionnalité est disponible à partir du plan <strong>Starter</strong>.
          </p>
          <Link
            href="/dashboard/abonnement"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Voir les plans
          </Link>
        </div>
      </div>
    </div>
  );
}

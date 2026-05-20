import { supabase } from "../../lib/supabase-server";
import Link from "next/link";

const PLAN_PRICES: Record<string, number> = { free: 0, starter: 9900, pro: 24900 };
const PLAN_LABELS: Record<string, string> = { free: "Gratuit", starter: "Starter", pro: "Pro" };
const PLAN_BADGE: Record<string, string> = {
  free: "text-slate-400 bg-slate-700/60 border border-slate-600",
  starter: "text-blue-300 bg-blue-500/15 border border-blue-500/30",
  pro: "text-orange-300 bg-orange-500/15 border border-orange-500/30",
};
const STATUS_BADGE: Record<string, string> = {
  active: "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30",
  suspended: "text-red-300 bg-red-500/15 border border-red-500/30",
};

function formatFCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

async function getStats() {
  const [
    { count: total },
    { count: active },
    { count: suspended },
    { data: planData },
    { data: recent },
  ] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("restaurants").select("plan").neq("plan", "free"),
    supabase
      .from("restaurants")
      .select("id, name, slug, email, plan, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const plans = (planData ?? []).reduce((acc: Record<string, number>, r: { plan: string }) => {
    const p = r.plan ?? "free";
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});

  const planCounts = { free: 0, starter: 0, pro: 0, ...plans };
  const mrr = Object.entries(planCounts).reduce((sum, [plan, count]) => {
    return sum + (PLAN_PRICES[plan] ?? 0) * count;
  }, 0);

  return {
    total: total ?? 0,
    active: active ?? 0,
    suspended: suspended ?? 0,
    plans: planCounts,
    mrr,
    recent: recent ?? [],
  };
}

export default async function SuperAdminDashboard() {
  const stats = await getStats();

  const kpiCards = [
    {
      label: "Restaurants inscrits",
      value: stats.total,
      sub: "sur la plateforme",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-orange-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      accent: "from-orange-500/20 to-orange-500/5 border-orange-500/25",
      valueColor: "text-orange-400",
    },
    {
      label: "Abonnés actifs",
      value: stats.active,
      sub: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% du total`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-emerald-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/25",
      valueColor: "text-emerald-400",
    },
    {
      label: "Comptes suspendus",
      value: stats.suspended,
      sub: `${stats.total > 0 ? Math.round((stats.suspended / stats.total) * 100) : 0}% du total`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-red-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      accent: "from-red-500/20 to-red-500/5 border-red-500/25",
      valueColor: "text-red-400",
    },
    {
      label: "Revenu mensuel (MRR)",
      value: formatFCFA(stats.mrr),
      sub: `${(stats.plans.starter ?? 0) + (stats.plans.pro ?? 0)} abonnements payants`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-violet-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: "from-violet-500/20 to-violet-500/5 border-violet-500/25",
      valueColor: "text-violet-400",
      large: true,
    },
  ];

  const planDetails = [
    { key: "free", label: "Gratuit", price: "0 FCFA", color: "bg-slate-500", ring: "ring-slate-500/30", text: "text-slate-300" },
    { key: "starter", label: "Starter", price: "9 900 FCFA/mois", color: "bg-blue-500", ring: "ring-blue-500/30", text: "text-blue-300" },
    { key: "pro", label: "Pro", price: "24 900 FCFA/mois", color: "bg-orange-500", ring: "ring-orange-500/30", text: "text-orange-300" },
  ] as const;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight">Vue d&apos;ensemble</h1>
        <p className="text-slate-400 mt-1.5 text-base">Tableau de bord de la plateforme TableFlow</p>
      </div>

      {/* KPI Cards — 2×2 centered grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10 max-w-3xl mx-auto">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`relative rounded-2xl border bg-gradient-to-br ${card.accent} p-7 flex flex-col gap-4 overflow-hidden`}
          >
            {/* Background glow */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white blur-3xl" />
            </div>

            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center">
              {card.icon}
            </div>

            {/* Value */}
            <div>
              <div className={`font-black leading-none ${card.large ? "text-2xl" : "text-5xl"} ${card.valueColor}`}>
                {card.value}
              </div>
              <div className="text-slate-200 font-semibold text-base mt-2">{card.label}</div>
              <div className="text-slate-500 text-sm mt-0.5">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid: Plans + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">

        {/* Plan breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-6">Répartition des plans</h2>
          <div className="space-y-5">
            {planDetails.map(({ key, label, price, color, ring, text }) => {
              const count = stats.plans[key] ?? 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const revenue = PLAN_PRICES[key] * count;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className={`font-semibold text-sm ${text}`}>{label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-black text-xl">{count}</span>
                      <span className="text-slate-500 text-xs ml-1">({pct}%)</span>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full bg-slate-800 ring-1 ${ring} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {revenue > 0 && (
                    <div className="text-slate-500 text-xs mt-1.5 text-right">
                      {formatFCFA(revenue)}/mois
                    </div>
                  )}
                  <div className="text-slate-600 text-xs mt-0.5 text-right">{price}</div>
                </div>
              );
            })}
          </div>

          {/* MRR summary */}
          <div className="mt-8 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium">MRR total</span>
              <span className="text-violet-400 font-black text-lg">{formatFCFA(stats.mrr)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-500 text-xs">Abonnements payants</span>
              <span className="text-slate-300 font-bold text-sm">
                {(stats.plans.starter ?? 0) + (stats.plans.pro ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent restaurants with email */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Derniers inscrits</h2>
            <Link
              href="/superadmin/restaurants"
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Voir tout
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {stats.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Aucun restaurant inscrit</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recent.map((r: {
                id: string; name: string; slug: string; email: string;
                plan: string; status: string; created_at: string;
              }) => (
                <div
                  key={r.id}
                  className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-800/60 transition-colors"
                >
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-orange-600/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <span className="text-orange-400 font-black text-base leading-none">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{r.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-slate-500 shrink-0">
                          <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                          <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                        </svg>
                        <span className="text-slate-500 text-xs truncate">{r.email || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: badges + date */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PLAN_BADGE[r.plan ?? "free"]}`}>
                      {PLAN_LABELS[r.plan ?? "free"]}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[r.status] ?? STATUS_BADGE.suspended}`}>
                      {r.status === "active" ? "Actif" : "Suspendu"}
                    </span>
                    <span className="text-slate-600 text-xs hidden md:block whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import OrderNotificationBell from "./OrderNotificationBell";
import ReadyOrderBell from "./ReadyOrderBell";
import WaiterCallBell from "./WaiterCallBell";
import InstallPrompt from "./InstallPrompt";
import ShareButton from "./ShareButton";
import { PlanContext } from "./PlanContext";
import type { Role } from "../../lib/auth";
import type { PlanInfo } from "../../lib/plan-utils";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  userName: string;
  userRole: Role;
  restaurantPlan?: "free" | "starter" | "pro";
  planExpiresAt?: string | null;
  planInfo: PlanInfo;
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* Wrapper qui construit l'URL côté client */
function ShareRestaurantButton({ slug, name }: { slug: string; name: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return <ShareButton url={`${origin}/${slug}`} title={name} variant="header" />;
}

export default function DashboardShell({
  children,
  restaurantId,
  restaurantName,
  restaurantSlug,
  userName,
  userRole,
  restaurantPlan = "free",
  planExpiresAt,
  planInfo,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = getInitials(userName || restaurantName);

  return (
    /* ── Injection du PlanContext pour tous les composants enfants ── */
    <PlanContext.Provider value={planInfo}>
      <div className="min-h-screen bg-slate-50">

        {/* ── Bannière période d'essai ──────────────────────────────── */}
        {planInfo.isInTrial && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">🎁</span>
              <div className="min-w-0">
                <span className="font-bold text-sm">Essai gratuit</span>
                <span className="text-orange-100 text-sm ml-1">— accès complet à toutes les fonctionnalités.</span>
                <span className="text-white font-extrabold text-sm ml-1">
                  {planInfo.trialDaysLeft} jour{planInfo.trialDaysLeft > 1 ? "s" : ""} restant{planInfo.trialDaysLeft > 1 ? "s" : ""}.
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/abonnement"
              className="shrink-0 bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Choisir un plan →
            </Link>
          </div>
        )}

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          restaurantName={restaurantName}
          restaurantSlug={restaurantSlug}
          userName={userName}
          userRole={userRole}
          initials={initials}
          restaurantPlan={restaurantPlan}
          planExpiresAt={planExpiresAt}
          planInfo={planInfo}
        />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="lg:ml-60">
          <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex lg:hidden items-center justify-center p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-slate-900 font-bold text-base md:text-lg leading-tight">
                  Tableau de bord
                </h1>
                <p className="text-green-700 text-xs hidden sm:block">{restaurantName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShareRestaurantButton slug={restaurantSlug} name={restaurantName} />
              <WaiterCallBell restaurantId={restaurantId} />
              {/* Cloche "plat prêt" : uniquement pour le personnel de service (pas le cuisinier) */}
              {(userRole === "owner" || userRole === "manager" || userRole === "waiter") && (
                <ReadyOrderBell restaurantId={restaurantId} />
              )}
              <OrderNotificationBell restaurantId={restaurantId} />
              <div className="hidden sm:flex items-center gap-2 text-right">
                <div>
                  <div className="text-slate-800 text-xs font-semibold leading-tight">{userName}</div>
                  <div className="text-green-700 text-[11px]">
                    {userRole === "owner"   ? "Propriétaire"
                     : userRole === "manager" ? "Gérant"
                     : userRole === "waiter"  ? "Serveur"
                     : "Caissier"}
                  </div>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8">{children}</main>
        </div>

        <InstallPrompt />
      </div>
    </PlanContext.Provider>
  );
}

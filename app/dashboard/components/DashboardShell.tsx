"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import OrderNotificationBell from "./OrderNotificationBell";
import WaiterCallBell from "./WaiterCallBell";
import InstallPrompt from "./InstallPrompt";
import type { Role } from "../../lib/auth";

type Props = {
  children: React.ReactNode;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  userName: string;
  userRole: Role;
  restaurantPlan?: "free" | "starter" | "pro";
  planExpiresAt?: string | null;
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function DashboardShell({ children, restaurantId, restaurantName, restaurantSlug, userName, userRole, restaurantPlan = "free", planExpiresAt }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = getInitials(userName || restaurantName);

  return (
    <div className="min-h-screen bg-slate-50">
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
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:ml-60">
        <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="flex lg:hidden items-center justify-center p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Ouvrir le menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-slate-900 font-bold text-base md:text-lg leading-tight">Tableau de bord</h1>
              <p className="text-green-700 text-xs hidden sm:block">{restaurantName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WaiterCallBell restaurantId={restaurantId} />
            <OrderNotificationBell restaurantId={restaurantId} />
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div>
                <div className="text-slate-800 text-xs font-semibold leading-tight">{userName}</div>
                <div className="text-green-700 text-[11px]">
                  {userRole === "owner" ? "Propriétaire" : userRole === "manager" ? "Gérant" : userRole === "waiter" ? "Serveur" : "Caissier"}
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
  );
}

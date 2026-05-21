"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/superadmin/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/superadmin/restaurants", icon: "🍽️", label: "Restaurants" },
  { href: "/superadmin/abonnements", icon: "💳", label: "Abonnements" },
  { href: "/superadmin/tarifs", icon: "🏷️", label: "Tarifs" },
  { href: "/superadmin/blog", icon: "✍️", label: "Blog" },
];

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function SuperAdminSidebar({ isOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/superadmin/logout", { method: "POST" });
    window.location.href = "/superadmin/login";
  }

  return (
    <aside className={`fixed top-0 left-0 h-screen w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300
      ${isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"} lg:translate-x-0 lg:pointer-events-auto`}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
              T
            </div>
            <div>
              <div className="text-white font-extrabold text-sm leading-tight">TableFlow</div>
              <div className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">Super Admin</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          <span className="text-base">🚪</span>
          {loggingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </div>
    </aside>
  );
}

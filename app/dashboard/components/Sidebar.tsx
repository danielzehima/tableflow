"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Vue d'ensemble" },
  { href: "/dashboard/menu", icon: "📋", label: "Menu digital" },
  { href: "/dashboard/reservations", icon: "📅", label: "Réservations" },
  { href: "/dashboard/commandes", icon: "🛎️", label: "Commandes" },
  { href: "/dashboard/parametres", icon: "⚙️", label: "Paramètres" },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  restaurantName: string;
  restaurantSlug: string;
  initials: string;
};

function logout() {
  document.cookie = "restaurant_slug=; path=/; max-age=0";
  window.location.href = "/";
}

export default function Sidebar({
  isOpen = false,
  onClose,
  restaurantName,
  restaurantSlug,
  initials,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen w-60 bg-slate-900 flex flex-col z-50 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      {/* Logo + Restaurant */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="text-lg font-bold text-white">
              Table<span className="text-orange-500">Flow</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold leading-tight truncate">
              {restaurantName}
            </div>
            <div className="text-slate-400 text-xs">Gérant</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon, label }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bas de sidebar */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <Link
          href={`/${restaurantSlug}`}
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="text-base">🌐</span>
          Ma page publique
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
        >
          <span className="text-base">🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

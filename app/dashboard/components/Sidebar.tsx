"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ROLE_LABELS, ROLE_COLORS,
  canManageTeam, canManageMenu, canViewStats,
  canAccessReservations, canAccessKitchen,
} from "../../lib/auth";
import type { Role } from "../../lib/auth";
import type { PlanInfo } from "../../lib/plan-utils";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  restaurantName: string;
  restaurantSlug: string;
  userName: string;
  userRole: Role;
  initials: string;
  restaurantPlan?: "free" | "starter" | "pro";
  planExpiresAt?: string | null;
  planInfo?: PlanInfo;
};

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  free:    { label: "Gratuit",  color: "bg-slate-700 text-slate-300" },
  starter: { label: "Starter",  color: "bg-blue-900 text-blue-300" },
  pro:     { label: "Pro",      color: "bg-orange-900 text-orange-300" },
};

const CHAT_LAST_SEEN_KEY = "chat_last_seen";

export default function Sidebar({ isOpen = false, onClose, restaurantName, restaurantSlug, userName, userRole, initials, restaurantPlan = "free", planExpiresAt, planInfo }: SidebarProps) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [chatUnread, setChatUnread] = useState(0);

  // Keep pathnameRef in sync without making it a useCallback dep
  useEffect(() => { pathnameRef.current = pathname; });

  // Reset badge when user visits Messages page
  useEffect(() => {
    if (pathname === "/dashboard/messages") {
      localStorage.setItem(CHAT_LAST_SEEN_KEY, new Date().toISOString());
      setChatUnread(0);
    }
  }, [pathname]);

  // Poll for new visitor messages — stable interval, matches WaiterCallBell pattern
  const pollChat = useCallback(async () => {
    if (!canViewStats(userRole)) return;
    if (pathnameRef.current === "/dashboard/messages") return;
    try {
      const res = await fetch("/api/dashboard/chats?status=open");
      if (!res.ok) return;
      const data = await res.json();
      const lastSeen = localStorage.getItem(CHAT_LAST_SEEN_KEY) ?? new Date(0).toISOString();
      const unread = (data.chats as Array<{ chat_messages: Array<{ sender: string; created_at: string }> }>)
        .filter((s) => s.chat_messages?.some((m) => m.sender === "visitor" && m.created_at > lastSeen))
        .length;
      setChatUnread(unread);
    } catch {
      // network error — ignore
    }
  }, [userRole]);

  useEffect(() => {
    if (!canViewStats(userRole)) return;
    const iv = setInterval(pollChat, 5000);
    return () => clearInterval(iv);
  }, [pollChat, userRole]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // Mapping strict rôle → items visibles
  // owner   : tout (14 items)
  // manager : 1,2,3,5,10
  // waiter  : 2,3
  // cashier : 3,8
  const navItems = [
    { href: "/dashboard",                  icon: HomeIcon,     label: "Vue d'ensemble",   show: canViewStats(userRole) },          // 1
    { href: "/dashboard/reservations",     icon: CalIcon,      label: "Réservations",     show: canAccessReservations(userRole) }, // 2
    { href: "/dashboard/commandes",        icon: OrderIcon,    label: "Commandes",        show: true },                           // 3
    { href: "/dashboard/clients",          icon: UsersIcon,    label: "Clients",          show: canManageTeam(userRole) },        // 4
    { href: "/dashboard/analytics",        icon: ChartIcon,    label: "Analytics",        show: canViewStats(userRole) },         // 5
    { href: "/dashboard/personnalisation", icon: PaletteIcon,  label: "Personnalisation", show: canManageTeam(userRole) },        // 6
    { href: "/dashboard/avis",             icon: StarIcon,     label: "Avis clients",     show: canManageTeam(userRole) },        // 7
    { href: "/dashboard/fidelite",         icon: GiftIcon,     label: "Fidélité",         show: canManageTeam(userRole) },        // fidélité
    { href: "/dashboard/codes-promo",     icon: TagIcon,      label: "Codes promo",      show: canManageTeam(userRole) },        // promo
    { href: "/dashboard/heures-creuses", icon: ClockIcon,    label: "Heures creuses",   show: canManageTeam(userRole) },        // heures creuses
    { href: "/dashboard/evenements",     icon: EventIcon,    label: "Événements",       show: canManageTeam(userRole) },        // événements
    { href: "/dashboard/newsletter",      icon: MailIcon,     label: "Newsletter",       show: canManageTeam(userRole) },        // newsletter
    { href: "/dashboard/cuisine",          icon: ChefIcon,     label: "Vue Cuisine",      show: canAccessKitchen(userRole) },     // 8
    { href: "/dashboard/salle",            icon: TableIcon,    label: "Plan de salle",    show: canManageTeam(userRole) },        // 9
    { href: "/dashboard/menu",             icon: MenuIcon,     label: "Menu digital",     show: canManageMenu(userRole) },        // 10
    { href: "/dashboard/tables",           icon: QrIcon,       label: "Tables & QR",      show: canManageTeam(userRole) },        // 11
    { href: "/dashboard/messages",         icon: ChatIcon,     label: "Messages",         show: canViewStats(userRole) },         // chat
    { href: "/dashboard/equipe",            icon: TeamIcon,       label: "Équipe",              show: canManageTeam(userRole) },
    { href: "/dashboard/paiement-en-ligne",icon: PaymentIcon,   label: "Paiement en ligne",  show: canManageTeam(userRole) },
    { href: "/dashboard/abonnement",       icon: CreditIcon,    label: "Abonnement",          show: canManageTeam(userRole) },
    { href: "/dashboard/parametres",       icon: SettingsIcon, label: "Paramètres",       show: canManageTeam(userRole) },        // 13
  ].filter((item) => item.show);

  return (
    <aside className={`fixed top-0 left-0 h-screen w-60 bg-slate-900 flex flex-col z-50 transition-transform duration-300
      ${isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"} lg:translate-x-0 lg:pointer-events-auto`}>

      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white rounded-xl p-1 shrink-0">
              <img src="/logo.png" alt="TableFlow" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-white font-bold text-base">TableFlow</span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 text-emerald-300 hover:text-white rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{userName}</div>
            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 ${ROLE_COLORS[userRole]}`}>
              {ROLE_LABELS[userRole]}
            </span>
          </div>
        </div>

        <div className="mt-2 text-emerald-300 text-xs truncate">{restaurantName}</div>

        {/* Badge plan / essai — pleine largeur sous le nom du restaurant */}
        <div className="mt-2">
          {planInfo?.isInTrial ? (
            <Link
              href="/dashboard/abonnement"
              onClick={onClose}
              className="flex items-center justify-between w-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-xl px-3 py-2 group hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">🎁</span>
                <div className="min-w-0">
                  <p className="text-white text-[11px] font-bold leading-tight">Essai gratuit</p>
                  <p className="text-orange-200 text-[10px] leading-tight">
                    {planInfo.trialDaysLeft} jour{planInfo.trialDaysLeft > 1 ? "s" : ""} restant{planInfo.trialDaysLeft > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <span className="text-orange-200 text-[10px] font-semibold shrink-0 group-hover:text-white">
                Choisir →
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/abonnement"
                onClick={onClose}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PLAN_BADGE[restaurantPlan]?.color ?? PLAN_BADGE.free.color}`}
              >
                {PLAN_BADGE[restaurantPlan]?.label ?? "Gratuit"}
              </Link>
              {planExpiresAt && restaurantPlan !== "free" && (
                <span className="text-[10px] text-slate-500">
                  exp. {new Date(planExpiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          const isMessages = href === "/dashboard/messages";
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-orange-500 text-white" : "text-emerald-300 hover:bg-slate-800 hover:text-white"
              }`}>
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1">{label}</span>
              {isMessages && chatUnread > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
        <Link href={`/${restaurantSlug}`} target="_blank" onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-300 hover:bg-slate-800 hover:text-white transition-colors">
          <GlobeIcon className="w-4.5 h-4.5 shrink-0" />
          Ma page publique
        </Link>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-300 hover:bg-red-900/40 hover:text-red-400 transition-colors">
          <LogoutIcon className="w-4.5 h-4.5 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ── Icons ────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function CalIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function OrderIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function ChartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function PaletteIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
}
function StarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}
function ChefIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM16.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5 9h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1zM7 13v7m5-7v7m5-7v7" /></svg>;
}
function TableIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" /></svg>;
}
function MenuIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
}
function QrIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>;
}
function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
}
function TeamIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function CreditIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function GlobeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}
function GiftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 00-2 2c0 1.1.9 2 2 2h4zm0 0V6a4 4 0 014-4 2 2 0 012 2c0 1.1-.9 2-2 2h-4zm-7 4h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1zM5 14h14v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6z" /></svg>;
}
function TagIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>;
}
function MailIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function PaymentIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}
function EventIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}

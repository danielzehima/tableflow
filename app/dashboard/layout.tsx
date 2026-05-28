import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabase } from "../lib/supabase-server";
import { getSession } from "../lib/auth-server";
import {
  canManageTeam, canManageMenu, canViewStats,
  canAccessReservations, canAccessKitchen,
  landingPage,
} from "../lib/auth";
import type { Role } from "../lib/auth";
import DashboardShell from "./components/DashboardShell";

// Règles d'accès strictes par route
// Propriétaire : tout
// Gérant       : overview, reservations, commandes, analytics, menu
// Serveur      : reservations, commandes
// Cuisinier    : commandes, cuisine
const ROUTE_GUARDS: Array<{ path: string; check: (role: Role) => boolean }> = [
  { path: "/dashboard/equipe",           check: canManageTeam },
  { path: "/dashboard/abonnement",       check: canManageTeam },
  { path: "/dashboard/parametres",       check: canManageTeam },
  { path: "/dashboard/personnalisation", check: canManageTeam },
  { path: "/dashboard/clients",          check: canManageTeam },
  { path: "/dashboard/avis",             check: canManageTeam },
  { path: "/dashboard/salle",            check: canManageTeam },
  { path: "/dashboard/tables",           check: canManageTeam },
  { path: "/dashboard/analytics",        check: canViewStats },
  { path: "/dashboard/messages",         check: canViewStats },
  { path: "/dashboard/menu",             check: canManageMenu },
  { path: "/dashboard/cuisine",          check: canAccessKitchen },
  { path: "/dashboard/reservations",     check: canAccessReservations },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, onboarding_done, plan, plan_expires_at, status")
    .eq("id", session.restaurantId)
    .single();

  if (!restaurant) redirect("/login");

  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isOnboarding = pathname === "/dashboard/onboarding";

  if (!restaurant.onboarding_done && !isOnboarding) {
    redirect("/dashboard/onboarding");
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  // Rediriger depuis la racine /dashboard si le rôle n'a pas accès à la vue d'ensemble
  if (pathname === "/dashboard" && !canViewStats(session.role)) {
    redirect(landingPage(session.role));
  }

  // Vérification des droits d'accès — redirection vers la page de départ du rôle
  for (const { path, check } of ROUTE_GUARDS) {
    if (pathname.startsWith(path) && !check(session.role)) {
      redirect(landingPage(session.role));
    }
  }

  const rawPlan = (restaurant as { plan?: string }).plan ?? "free";
  const planExpiresAt = (restaurant as { plan_expires_at?: string | null }).plan_expires_at ?? null;
  const isPlanActive = rawPlan !== "free" && (!planExpiresAt || new Date(planExpiresAt) > new Date());
  const restaurantPlan: "free" | "starter" | "pro" = isPlanActive ? (rawPlan as "starter" | "pro") : "free";

  return (
    <DashboardShell
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      restaurantSlug={restaurant.slug}
      userName={session.name}
      userRole={session.role}
      restaurantPlan={restaurantPlan}
      planExpiresAt={planExpiresAt}
    >
      {children}
    </DashboardShell>
  );
}

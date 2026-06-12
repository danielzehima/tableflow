import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabase } from "../lib/supabase-server";
import { getSession } from "../lib/auth-server";
import {
  canManageTeam, canManageMenu, canViewStats,
  canAccessReservations, canAccessKitchen,
  landingPage,
} from "../lib/auth";
import {
  computePlanInfo,
  canAccessRoute,
  requiredPlanForRoute,
  FEATURE_LABELS,
} from "../lib/plan-utils";
import type { Role } from "../lib/auth";
import { asCurrency } from "../lib/currency";
import DashboardShell from "./components/DashboardShell";

// ── Garde-fous par rôle (inchangés) ──────────────────────────────
const ROLE_GUARDS: Array<{ path: string; check: (role: Role) => boolean }> = [
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
  { path: "/dashboard/fidelite",         check: canManageTeam },
  { path: "/dashboard/codes-promo",      check: canManageTeam },
  { path: "/dashboard/heures-creuses",   check: canManageTeam },
  { path: "/dashboard/evenements",       check: canManageTeam },
  { path: "/dashboard/newsletter",       check: canManageTeam },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // ── Récupération du restaurant (avec created_at pour le trial) ──
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, onboarding_done, plan, plan_expires_at, status, created_at, currency")
    .eq("id", session.restaurantId)
    .single();

  if (!restaurant) redirect("/login");

  const h        = await headers();
  const pathname = h.get("x-pathname") ?? "";

  // ── Pages spéciales : bypass complet ─────────────────────────────
  const isOnboarding  = pathname === "/dashboard/onboarding";
  const isSuspendedPg = pathname === "/dashboard/suspended";
  const isTrialEndPg  = pathname === "/dashboard/abonnement";

  // ── 1. Restaurant suspendu ────────────────────────────────────────
  if ((restaurant as { status?: string }).status === "suspended") {
    if (!isSuspendedPg) redirect("/dashboard/suspended");
    return <>{children}</>;
  }
  if (isSuspendedPg) redirect("/dashboard");

  // ── 2. Onboarding ─────────────────────────────────────────────────
  if (!restaurant.onboarding_done && !isOnboarding) redirect("/dashboard/onboarding");
  if (isOnboarding) return <>{children}</>;

  // ── 3. Calcul du plan effectif (trial / free / starter / pro) ─────
  const planInfo = computePlanInfo({
    created_at:      restaurant.created_at as string,
    plan:            (restaurant as { plan?: string }).plan ?? "free",
    plan_expires_at: (restaurant as { plan_expires_at?: string | null }).plan_expires_at ?? null,
  });

  // ── 4. Essai terminé sans abonnement → redirection abonnement ─────
  if (planInfo.trialEnded && !isTrialEndPg) {
    redirect("/dashboard/abonnement?reason=trial_ended");
  }

  // ── 5. Garde-fous rôle ────────────────────────────────────────────
  if (pathname === "/dashboard" && !canViewStats(session.role)) {
    redirect(landingPage(session.role));
  }
  for (const { path, check } of ROLE_GUARDS) {
    if (pathname.startsWith(path) && !check(session.role)) {
      redirect(landingPage(session.role));
    }
  }

  // ── 6. Garde-fous plan (uniquement hors trial) ────────────────────
  if (!planInfo.isInTrial && !isTrialEndPg) {
    if (!canAccessRoute(planInfo.effectivePlan, pathname)) {
      const requiredPlan = requiredPlanForRoute(pathname);
      const featureName  = Object.entries(FEATURE_LABELS).find(
        ([route]) => pathname.startsWith(route)
      )?.[1] ?? "cette fonctionnalité";
      const encoded = encodeURIComponent(featureName);
      redirect(
        `/dashboard/abonnement?reason=upgrade_required&feature=${encoded}&required=${requiredPlan ?? "starter"}`
      );
    }
  }

  // ── 7. Calcul du plan "propre" pour l'UI ──────────────────────────
  const restaurantPlan: "free" | "starter" | "pro" =
    planInfo.effectivePlan === "trial"
      ? "free"   // pendant l'essai on affiche "Gratuit" + badge "Essai"
      : planInfo.effectivePlan === "free"
      ? "free"
      : (planInfo.effectivePlan as "starter" | "pro");

  const planExpiresAt =
    (restaurant as { plan_expires_at?: string | null }).plan_expires_at ?? null;

  return (
    <DashboardShell
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      restaurantSlug={restaurant.slug}
      userName={session.name}
      userRole={session.role}
      restaurantPlan={restaurantPlan}
      planExpiresAt={planExpiresAt}
      planInfo={planInfo}
      currency={asCurrency((restaurant as { currency?: string }).currency)}
    >
      {children}
    </DashboardShell>
  );
}

// ================================================================
// TableFlow — Utilitaires de gestion des plans et de la période d'essai
// Source unique de vérité : toute la logique plan/trial passe ici.
// ================================================================

export const TRIAL_DAYS = 14;

export type EffectivePlan = "trial" | "free" | "starter" | "pro";

export type PlanInfo = {
  /** Plan "réel" perçu par le système : trial (accès complet), free, starter ou pro */
  effectivePlan: EffectivePlan;
  /** true pendant les 14 premiers jours */
  isInTrial: boolean;
  /** Nombre de jours restants dans l'essai (0 si hors essai) */
  trialDaysLeft: number;
  /** Essai terminé ET aucun abonnement payant actif */
  trialEnded: boolean;
  /** Accès complet = trial en cours OU plan payant actif */
  hasFullAccess: boolean;
  /** Date de fin d'essai */
  trialEndsAt: Date;
};

export function computePlanInfo(restaurant: {
  created_at: string;
  plan: string;
  plan_expires_at: string | null;
}): PlanInfo {
  const now = new Date();

  // ── Calcul de la fin d'essai ────────────────────────────────────
  const createdAt   = new Date(restaurant.created_at);
  const trialEndsAt = new Date(createdAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const isInTrial     = now < trialEndsAt;
  // Nombre de jours restants : on compte les jours entiers restants à partir d'aujourd'hui.
  // Ex : créé le 21 mai, fin le 4 juin, aujourd'hui 29 mai → 4 juin - 29 mai = 6 jours civils
  // mais il reste les jours 30, 31 mai + 1, 2, 3, 4 juin = 5 jours complets → Math.floor
  const msLeft        = trialEndsAt.getTime() - now.getTime();
  const trialDaysLeft = isInTrial ? Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24))) : 0;

  // ── Plan payant actif ───────────────────────────────────────────
  const hasPaidPlan  = restaurant.plan !== "free";
  const isPaidActive = hasPaidPlan &&
    (!restaurant.plan_expires_at || new Date(restaurant.plan_expires_at) > now);

  // ── Plan effectif ───────────────────────────────────────────────
  let effectivePlan: EffectivePlan;
  if (isInTrial) {
    effectivePlan = "trial";
  } else if (isPaidActive) {
    effectivePlan = restaurant.plan as "starter" | "pro";
  } else {
    effectivePlan = "free";
  }

  const trialEnded   = !isInTrial && !isPaidActive;
  const hasFullAccess = isInTrial || isPaidActive;

  return {
    effectivePlan,
    isInTrial,
    trialDaysLeft,
    trialEnded,
    hasFullAccess,
    trialEndsAt,
  };
}

// ================================================================
// Règles d'accès par route
// "trial" a accès à tout → non listé ici, géré dans le layout
// ================================================================

/** Routes réservées au plan Starter ou Pro */
export const STARTER_ROUTES = [
  "/dashboard/commandes",
  "/dashboard/codes-promo",
  "/dashboard/heures-creuses",
  "/dashboard/avis",
  "/dashboard/analytics",
  "/dashboard/messages",
  "/dashboard/evenements",
  "/dashboard/tables",
  "/dashboard/salle",
  "/dashboard/personnalisation",
  "/dashboard/parametres",
  "/dashboard/clients",
  "/dashboard/paiement-en-ligne",
] as const;

/** Routes réservées au plan Pro uniquement */
export const PRO_ROUTES = [
  "/dashboard/fidelite",
  "/dashboard/newsletter",
  "/dashboard/equipe",
] as const;

/** Vérifie si un plan effectif a accès à une route */
export function canAccessRoute(
  effectivePlan: EffectivePlan,
  pathname: string
): boolean {
  // Trial = accès complet
  if (effectivePlan === "trial") return true;

  // Pro = accès à tout
  if (effectivePlan === "pro") return true;

  // Starter = tout sauf les routes Pro
  if (effectivePlan === "starter") {
    return !PRO_ROUTES.some((r) => pathname.startsWith(r));
  }

  // Free = aucune route payante
  const isStarterRoute = STARTER_ROUTES.some((r) => pathname.startsWith(r));
  const isProRoute     = PRO_ROUTES.some((r) => pathname.startsWith(r));
  return !isStarterRoute && !isProRoute;
}

/** Libellés lisibles par fonctionnalité */
export const FEATURE_LABELS: Record<string, string> = {
  "/dashboard/commandes":        "Commandes en ligne",
  "/dashboard/codes-promo":      "Codes promo",
  "/dashboard/heures-creuses":   "Heures creuses",
  "/dashboard/avis":             "Avis clients",
  "/dashboard/analytics":        "Analytics avancées",
  "/dashboard/messages":         "Messagerie visiteurs",
  "/dashboard/evenements":       "Événements",
  "/dashboard/tables":           "Tables & QR codes",
  "/dashboard/salle":            "Plan de salle",
  "/dashboard/personnalisation": "Personnalisation",
  "/dashboard/parametres":       "Paramètres avancés",
  "/dashboard/clients":          "Gestion clients",
  "/dashboard/paiement-en-ligne":"Paiement Mobile Money",
  "/dashboard/fidelite":         "Programme de fidélité",
  "/dashboard/newsletter":       "Newsletter",
  "/dashboard/equipe":           "Gestion d'équipe",
};

/** Plan minimum requis pour une route */
export function requiredPlanForRoute(pathname: string): "starter" | "pro" | null {
  if (PRO_ROUTES.some((r) => pathname.startsWith(r)))     return "pro";
  if (STARTER_ROUTES.some((r) => pathname.startsWith(r))) return "starter";
  return null;
}

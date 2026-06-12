"use client";

import { createContext, useContext } from "react";
import type { EffectivePlan, PlanInfo } from "../../lib/plan-utils";

// Valeur par défaut sécurisée (jamais utilisée en pratique car le layout fournit toujours la valeur)
const defaultInfo: PlanInfo = {
  effectivePlan: "free",
  isInTrial: false,
  trialDaysLeft: 0,
  trialEnded: false,
  hasFullAccess: false,
  trialEndsAt: new Date(),
};

export const PlanContext = createContext<PlanInfo>(defaultInfo);

export function usePlan(): PlanInfo {
  return useContext(PlanContext);
}

export function useEffectivePlan(): EffectivePlan {
  return useContext(PlanContext).effectivePlan;
}

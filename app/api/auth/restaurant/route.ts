import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";
import { computePlanInfo } from "../../../lib/plan-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, plan, plan_expires_at, status, created_at")
    .eq("id", session.restaurantId)
    .single();

  if (error || !data) {
    // Fallback si colonnes manquantes
    const { data: minimal } = await supabase
      .from("restaurants")
      .select("id, name, slug, created_at")
      .eq("id", session.restaurantId)
      .single();
    if (!minimal) return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });

    const base = { ...minimal, plan: "free", plan_expires_at: null, status: "active" };
    const planInfo = computePlanInfo({
      created_at:      (minimal as { created_at?: string }).created_at ?? new Date().toISOString(),
      plan:            "free",
      plan_expires_at: null,
    });
    return NextResponse.json({ ...base, ...planInfo });
  }

  // Calcul du plan effectif (trial inclus)
  const planInfo = computePlanInfo({
    created_at:      (data as { created_at?: string }).created_at ?? new Date().toISOString(),
    plan:            (data as { plan?: string }).plan ?? "free",
    plan_expires_at: (data as { plan_expires_at?: string | null }).plan_expires_at ?? null,
  });

  return NextResponse.json({ ...data, ...planInfo });
}

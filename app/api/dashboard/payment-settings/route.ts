import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

// ── GET : récupère les paramètres de paiement (clés masquées) ──────────────
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("restaurants")
    .select("online_payment_enabled, geniuspay_api_key, geniuspay_api_secret")
    .eq("id", session.restaurantId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  // Masquer les clés : afficher seulement les 6 premiers et 4 derniers caractères
  function maskKey(key: string | null): string | null {
    if (!key || key.length < 12) return key ? "••••••••••••" : null;
    return key.slice(0, 6) + "••••••••••••" + key.slice(-4);
  }

  return NextResponse.json({
    online_payment_enabled: data.online_payment_enabled ?? false,
    api_key_set: !!data.geniuspay_api_key,
    api_secret_set: !!data.geniuspay_api_secret,
    api_key_masked: maskKey(data.geniuspay_api_key),
    api_secret_masked: maskKey(data.geniuspay_api_secret),
  });
}

// ── PUT : sauvegarde les paramètres de paiement ────────────────────────────
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Seul owner ou manager peut modifier
  if (session.role !== "owner" && session.role !== "manager") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json() as {
    online_payment_enabled?: boolean;
    api_key?: string;
    api_secret?: string;
  };

  // Vérifier que le restaurant a un plan suffisant (starter ou pro)
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("plan, plan_expires_at, created_at")
    .eq("id", session.restaurantId)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const now = new Date();
  const trialEndsAt = new Date(restaurant.created_at);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const isInTrial = now < trialEndsAt;
  const isPaidActive =
    restaurant.plan !== "free" &&
    (!restaurant.plan_expires_at || new Date(restaurant.plan_expires_at) > now);

  if (!isInTrial && !isPaidActive) {
    return NextResponse.json(
      { error: "Cette fonctionnalité nécessite un abonnement Starter ou Pro." },
      { status: 403 }
    );
  }

  // Construire le payload de mise à jour
  const updates: Record<string, unknown> = {};

  if (typeof body.online_payment_enabled === "boolean") {
    updates.online_payment_enabled = body.online_payment_enabled;
  }

  // Ne mettre à jour les clés que si elles sont fournies et non vides
  if (body.api_key && body.api_key.trim() && !body.api_key.includes("••")) {
    updates.geniuspay_api_key = body.api_key.trim();
  }
  if (body.api_secret && body.api_secret.trim() && !body.api_secret.includes("••")) {
    updates.geniuspay_api_secret = body.api_secret.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, message: "Rien à mettre à jour" });
  }

  const { error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", session.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

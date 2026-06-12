import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "../../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  return token && token === process.env.ADMIN_SECRET;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // ── Action suspension / réactivation ─────────────────────────────
  if (body.action === "suspend" || body.action === "reactivate") {
    const newStatus = body.action === "suspend" ? "suspended" : "active";
    const updates: Record<string, unknown> = { status: newStatus };
    if (body.action === "suspend") {
      updates.suspension_reason = "admin";
    } else {
      // Réactivation : effacer le motif et les flags email pour repartir proprement
      updates.suspension_reason = null;
      updates.expiry_email_sent = false;
      updates.trial_warning_sent = false;
    }
    const { data, error } = await supabase
      .from("restaurants")
      .update(updates)
      .eq("id", id)
      .select("id, name, plan, plan_expires_at, status, suspension_reason")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // ── Changement de plan ────────────────────────────────────────────
  const { plan, months } = body;

  const validPlans = ["free", "starter", "pro"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const update: Record<string, string | null> = { plan };

  if (plan === "free") {
    update.plan_expires_at = null;
  } else {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + (months ?? 1));
    update.plan_expires_at = expires.toISOString();
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update(update)
    .eq("id", id)
    .select("id, name, plan, plan_expires_at, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

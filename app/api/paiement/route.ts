import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import { getSession } from "../../lib/auth-server";

const PLAN_PRICES: Record<string, number> = { free: 0, starter: 9900, pro: 24900 };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { plan, method, phone } = await req.json();

  if (!plan || !method) {
    return NextResponse.json({ error: "Plan et méthode requis" }, { status: 400 });
  }

  const amount = PLAN_PRICES[plan] ?? 0;
  const reference = `TF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // Simulate payment processing (in production: call Wave/Orange Money/PayDunya API here)
  // For now we always succeed after recording the payment
  const { error: payErr } = await supabase.from("payments").insert({
    restaurant_id: session.restaurantId,
    plan,
    amount,
    currency: "FCFA",
    method,
    phone: phone ?? null,
    status: "success",
    reference,
  });

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // Update restaurant plan
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error: planErr } = await supabase
    .from("restaurants")
    .update({ plan, plan_expires_at: expiresAt.toISOString(), status: "active" })
    .eq("id", session.restaurantId);

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, reference, plan, amount });
}

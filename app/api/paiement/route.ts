import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import { getSession } from "../../lib/auth-server";
import { initGeniusPayPayment } from "../../lib/geniuspay";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { plan } = await req.json();
  if (!plan) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

  const { data: planSetting } = await supabase
    .from("plan_settings")
    .select("price")
    .eq("plan", plan)
    .single();

  const amount = planSetting?.price ?? 0;
  if (amount === 0) {
    return NextResponse.json({ error: "Plan invalide ou gratuit" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tableflow-gilt.vercel.app";

  const result = await initGeniusPayPayment({
    amount,
    description: `Abonnement TableFlow — Plan ${plan}`,
    returnUrl: `${appUrl}/dashboard/abonnement`,
    customerName: session.name ?? "Restaurant",
    metadata: { restaurant_id: session.restaurantId, plan },
  });

  if (!result.success || !result.data?.checkout_url) {
    return NextResponse.json({ error: result.message ?? "Erreur GeniusPay" }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("payments").insert({
    restaurant_id: session.restaurantId,
    plan,
    amount,
    currency: "XOF",
    method: "geniuspay",
    status: "pending",
    reference: result.data.reference,
  });

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ payment_url: result.data.checkout_url, transaction_id: result.data.reference });
}

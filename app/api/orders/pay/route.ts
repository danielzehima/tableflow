import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { initGeniusPayPayment } from "../../../lib/geniuspay";

export async function POST(req: Request) {
  const { order_id, customer_name, customer_phone } = await req.json();

  if (!order_id) return NextResponse.json({ error: "order_id requis" }, { status: 400 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, total, table_number, restaurant_id, restaurants(name, slug, geniuspay_api_key, geniuspay_api_secret)")
    .eq("id", order_id)
    .single();

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const restaurant = (Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants) as { name: string; slug: string; geniuspay_api_key?: string | null; geniuspay_api_secret?: string | null } | null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tableflow-gilt.vercel.app";

  const result = await initGeniusPayPayment({
    amount: Number(order.total),
    description: `Commande Table ${order.table_number} — ${restaurant?.name ?? "Restaurant"}`,
    returnUrl: `${appUrl}/${restaurant?.slug ?? ""}?paid=1&order_id=${order_id}`,
    customerName: customer_name || "Client",
    customerPhone: customer_phone,
    metadata: { order_id, restaurant_id: order.restaurant_id },
    apiKey: restaurant?.geniuspay_api_key,
    apiSecret: restaurant?.geniuspay_api_secret,
  });

  if (!result.success || !result.data?.checkout_url) {
    return NextResponse.json({ error: result.message ?? "Erreur GeniusPay" }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("payments").insert({
    restaurant_id: order.restaurant_id,
    order_id,
    plan: "order",
    amount: Number(order.total),
    currency: "XOF",
    method: "geniuspay",
    status: "pending",
    reference: result.data.reference,
  });

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ payment_url: result.data.checkout_url });
}

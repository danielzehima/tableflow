import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

// GET /api/loyalty?restaurant_id=X&phone=Y — solde de points d'un client
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");
  const phone = searchParams.get("phone");

  if (!restaurant_id || !phone) {
    return NextResponse.json({ error: "restaurant_id et phone requis" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("loyalty_enabled, loyalty_points_per_order, loyalty_threshold, loyalty_reward")
    .eq("id", restaurant_id)
    .single();

  if (!restaurant?.loyalty_enabled) {
    return NextResponse.json({ enabled: false });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, loyalty_points")
    .eq("restaurant_id", restaurant_id)
    .eq("phone", phone.trim())
    .single();

  return NextResponse.json({
    enabled: true,
    points: customer?.loyalty_points ?? 0,
    threshold: restaurant.loyalty_threshold,
    reward: restaurant.loyalty_reward,
    points_per_order: restaurant.loyalty_points_per_order,
    customer_name: customer?.name ?? null,
  });
}

// POST /api/loyalty/redeem — utiliser une récompense
export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, phone, customer_name } = body;

  if (!restaurant_id || !phone) {
    return NextResponse.json({ error: "restaurant_id et phone requis" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("loyalty_enabled, loyalty_threshold, loyalty_reward")
    .eq("id", restaurant_id)
    .single();

  if (!restaurant?.loyalty_enabled) {
    return NextResponse.json({ error: "Programme de fidélité non activé" }, { status: 400 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, loyalty_points")
    .eq("restaurant_id", restaurant_id)
    .eq("phone", phone.trim())
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  if (customer.loyalty_points < restaurant.loyalty_threshold) {
    return NextResponse.json({ error: "Points insuffisants" }, { status: 400 });
  }

  // Déduire les points
  const newPoints = customer.loyalty_points - restaurant.loyalty_threshold;
  await supabase.from("customers").update({ loyalty_points: newPoints }).eq("id", customer.id);

  await supabase.from("loyalty_transactions").insert({
    restaurant_id,
    customer_id: customer.id,
    points: -restaurant.loyalty_threshold,
    type: "redeemed",
    description: `Récompense utilisée : ${restaurant.loyalty_reward}`,
  });

  return NextResponse.json({ success: true, points_remaining: newPoints, reward: restaurant.loyalty_reward });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  return token && token === process.env.ADMIN_SECRET;
}

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, slug, email, plan, plan_expires_at, status, created_at, onboarding_done")
    .order("created_at", { ascending: false });

  if (!restaurants) return NextResponse.json([]);

  // Récupérer les stats agrégées pour chaque restaurant
  const ids = restaurants.map((r) => r.id);

  const [ordersRes, paymentsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("restaurant_id, total, status")
      .in("restaurant_id", ids),
    supabase
      .from("payments")
      .select("restaurant_id, amount, status, plan")
      .in("restaurant_id", ids)
      .neq("plan", "order"),
  ]);

  const orders = ordersRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const result = restaurants.map((r) => {
    const rOrders = orders.filter((o) => o.restaurant_id === r.id);
    const rPayments = payments.filter((p) => p.restaurant_id === r.id && p.status === "success");
    return {
      ...r,
      order_count: rOrders.length,
      paid_order_count: rOrders.filter((o) => o.status === "paid").length,
      revenue_orders: rOrders
        .filter((o) => o.status === "paid")
        .reduce((s, o) => s + Number(o.total), 0),
      subscription_revenue: rPayments.reduce((s, p) => s + Number(p.amount), 0),
      subscription_count: rPayments.length,
    };
  });

  return NextResponse.json(result);
}

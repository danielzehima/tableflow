import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const { data: order } = await supabase
    .from("orders")
    .select("id, table_number, items, total, status, customer_name, customer_phone, created_at, restaurant_id, restaurants(name, address, phone, email)")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const { data: payment } = await supabase
    .from("payments")
    .select("reference, amount, currency, method, status, created_at")
    .eq("order_id", orderId)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;

  return NextResponse.json({
    order: {
      id: order.id,
      table_number: order.table_number,
      items: order.items,
      total: order.total,
      status: order.status,
      customer_name: order.customer_name,
      created_at: order.created_at,
    },
    restaurant: {
      name: restaurant?.name ?? "",
      address: restaurant?.address ?? "",
      phone: restaurant?.phone ?? "",
      email: restaurant?.email ?? "",
    },
    payment: payment ?? null,
  });
}

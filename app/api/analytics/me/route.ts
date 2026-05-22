import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 90);

  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("restaurant_id", session.restaurantId)
    .gte("created_at", since.toISOString())
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    map[key] = { date: key, revenue: 0, orders: 0 };
  }

  for (const order of data ?? []) {
    const key = new Date(order.created_at).toISOString().split("T")[0];
    if (!map[key]) continue;
    map[key].orders++;
    if (order.status === "paid" || order.status === "Payé") {
      map[key].revenue += Number(order.total);
    }
  }

  return NextResponse.json(Object.values(map));
}

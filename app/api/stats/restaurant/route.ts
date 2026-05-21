import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

type RawOrder = {
  total: number;
  status: string;
  items: string;
  created_at: string;
};

function parseItems(str: string): Array<{ name: string; qty: number }> {
  return str
    .split(",")
    .map((s) => s.trim())
    .flatMap((part) => {
      const m = part.match(/^(\d+)x\s+(.+)$/);
      return m ? [{ qty: parseInt(m[1], 10), name: m[2].trim() }] : [];
    });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "7"; // "today" | "7" | "30" | "month"

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  let periodStart: Date;
  switch (period) {
    case "today":
      periodStart = todayStart;
      break;
    case "month":
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default: {
      const days = Math.min(Math.max(parseInt(period, 10) || 7, 1), 90);
      periodStart = new Date(todayStart);
      periodStart.setDate(periodStart.getDate() - days + 1);
    }
  }

  const [periodRes, yesterdayRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status, items, created_at")
      .eq("restaurant_id", session.restaurantId)
      .gte("created_at", periodStart.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("orders")
      .select("total, status")
      .eq("restaurant_id", session.restaurantId)
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString())
      .neq("status", "cancelled"),
  ]);

  const periodOrders: RawOrder[] = periodRes.data ?? [];
  const yesterdayOrders = yesterdayRes.data ?? [];

  // ── Today ────────────────────────────────────────────────────────
  const todayOrders = periodOrders.filter(
    (o) => new Date(o.created_at) >= todayStart
  );
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const todayCount = todayOrders.length;

  // ── Yesterday ────────────────────────────────────────────────────
  const yesterdayRevenue = yesterdayOrders.reduce(
    (s, o) => s + Number(o.total),
    0
  );
  const yesterdayCount = yesterdayOrders.length;

  // ── Top dishes ───────────────────────────────────────────────────
  const dishMap: Record<string, { count: number; revenue: number }> = {};
  for (const order of periodOrders) {
    if (!order.items) continue;
    const parsed = parseItems(order.items);
    const totalQty = parsed.reduce((s, i) => s + i.qty, 0);
    const pricePerUnit = totalQty > 0 ? Number(order.total) / totalQty : 0;
    for (const { name, qty } of parsed) {
      if (!dishMap[name]) dishMap[name] = { count: 0, revenue: 0 };
      dishMap[name].count += qty;
      dishMap[name].revenue += Math.round(pricePerUnit * qty);
    }
  }
  const topDishes = Object.entries(dishMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Peak hours (8h – 22h) ────────────────────────────────────────
  const hourMap: Record<number, number> = {};
  for (const order of periodOrders) {
    const h = new Date(order.created_at).getHours();
    hourMap[h] = (hourMap[h] ?? 0) + 1;
  }
  const peakHours = Array.from({ length: 15 }, (_, i) => ({
    hour: i + 8,
    count: hourMap[i + 8] ?? 0,
  }));

  return NextResponse.json({
    today: {
      revenue: todayRevenue,
      orders: todayCount,
      avgTicket: todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0,
    },
    yesterday: {
      revenue: yesterdayRevenue,
      orders: yesterdayCount,
    },
    topDishes,
    peakHours,
  });
}

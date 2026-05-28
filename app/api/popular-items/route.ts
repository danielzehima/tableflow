import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

// Parse "2x Poulet braisé, 1x Salade César" → { "Poulet braisé": 2, "Salade César": 1 }
function parseItems(itemsText: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const parts = itemsText.split(", ");
  for (const part of parts) {
    const match = part.match(/^(\d+)x (.+)$/);
    if (match) {
      const qty = parseInt(match[1]);
      const name = match[2].trim();
      counts[name] = (counts[name] ?? 0) + qty;
    }
  }
  return counts;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");
  if (!restaurant_id) {
    return NextResponse.json({ mostOrdered: null, trending: [] });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select("items, created_at")
    .eq("restaurant_id", restaurant_id)
    .neq("status", "cancelled")
    .gte("created_at", sevenDaysAgo)
    .limit(500);

  if (!orders || orders.length === 0) {
    return NextResponse.json({ mostOrdered: null, trending: [] });
  }

  const weekCounts: Record<string, number> = {};
  const todayCounts: Record<string, number> = {};

  for (const order of orders) {
    const parsed = parseItems(order.items ?? "");
    const isToday = order.created_at >= todayStart;
    for (const [name, qty] of Object.entries(parsed)) {
      weekCounts[name] = (weekCounts[name] ?? 0) + qty;
      if (isToday) todayCounts[name] = (todayCounts[name] ?? 0) + qty;
    }
  }

  // Le plus commandé sur 7 jours
  const mostOrdered = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Tendance : top 3 d'aujourd'hui (fallback sur 7 jours si peu de commandes)
  const trendSource = Object.keys(todayCounts).length >= 2 ? todayCounts : weekCounts;
  const trending = Object.entries(trendSource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return NextResponse.json({ mostOrdered, trending });
}

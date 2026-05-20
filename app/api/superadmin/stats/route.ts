import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { verifyAdminApi } from "../../../lib/admin-auth";

export async function GET() {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const [
    { count: totalRestaurants },
    { count: activeRestaurants },
    { count: suspendedRestaurants },
    { count: totalOrders },
    { count: totalReservations },
    { data: planCounts },
  ] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("reservations").select("*", { count: "exact", head: true }),
    supabase.from("restaurants").select("plan"),
  ]);

  const plans = (planCounts ?? []).reduce(
    (acc: Record<string, number>, r: { plan: string }) => {
      const p = r.plan ?? "free";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    totalRestaurants: totalRestaurants ?? 0,
    activeRestaurants: activeRestaurants ?? 0,
    suspendedRestaurants: suspendedRestaurants ?? 0,
    totalOrders: totalOrders ?? 0,
    totalReservations: totalReservations ?? 0,
    plans: { free: 0, starter: 0, pro: 0, ...plans },
  });
}

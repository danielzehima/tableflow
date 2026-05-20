import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([], { status: 401 });

  const { data } = await supabase
    .from("payments")
    .select("id, plan, amount, currency, method, status, reference, created_at")
    .eq("restaurant_id", session.restaurantId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data ?? []);
}

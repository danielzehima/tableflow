import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import { getSession } from "../../lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, order_count, last_order_at, created_at")
    .eq("restaurant_id", session.restaurantId)
    .order("last_order_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { getSession } from "../../../../lib/auth-server";

// Retourne les clients triés par points décroissants
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, loyalty_points, order_count")
    .eq("restaurant_id", session.restaurantId)
    .gt("loyalty_points", 0)
    .order("loyalty_points", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

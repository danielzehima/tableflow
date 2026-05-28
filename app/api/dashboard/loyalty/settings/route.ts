import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { getSession } from "../../../../lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data } = await supabase
    .from("restaurants")
    .select("loyalty_enabled, loyalty_points_per_order, loyalty_threshold, loyalty_reward")
    .eq("id", session.restaurantId)
    .single();

  return NextResponse.json(
    data ?? {
      loyalty_enabled: false,
      loyalty_points_per_order: 1,
      loyalty_threshold: 10,
      loyalty_reward: "Réduction de 500 FCFA",
    }
  );
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { loyalty_enabled, loyalty_points_per_order, loyalty_threshold, loyalty_reward } = body;

  const { error } = await supabase
    .from("restaurants")
    .update({ loyalty_enabled, loyalty_points_per_order, loyalty_threshold, loyalty_reward })
    .eq("id", session.restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

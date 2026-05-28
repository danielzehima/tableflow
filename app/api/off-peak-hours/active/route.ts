import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

// GET /api/off-peak-hours/active?restaurant_id=X
// Retourne tous les créneaux activés pour que le client calcule lequel est actif
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const { data } = await supabase
    .from("off_peak_hours")
    .select("id, label, start_time, end_time, discount_percent, days_of_week")
    .eq("restaurant_id", restaurant_id)
    .eq("enabled", true)
    .order("start_time", { ascending: true });

  return NextResponse.json(data ?? []);
}

import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!restaurant) return NextResponse.json([], { status: 200 });

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("events")
    .select("id, title, description, event_date, event_time, image_url, max_guests, price, event_reservations(guests_count, status)")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .gte("event_date", today)
    .order("event_date", { ascending: true });

  return NextResponse.json(data ?? []);
}

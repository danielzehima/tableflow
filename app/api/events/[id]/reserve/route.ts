import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: event_id } = await params;
  const { customer_name, customer_phone, customer_email, guests_count } = await req.json();

  if (!customer_name?.trim() || !customer_phone?.trim()) {
    return NextResponse.json({ error: "Nom et téléphone sont obligatoires" }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, restaurant_id, max_guests, is_active, event_date")
    .eq("id", event_id)
    .single();

  if (!event || !event.is_active) {
    return NextResponse.json({ error: "Événement introuvable ou inactif" }, { status: 404 });
  }

  if (new Date(event.event_date) < new Date(new Date().toDateString())) {
    return NextResponse.json({ error: "Cet événement est passé" }, { status: 400 });
  }

  if (event.max_guests) {
    const { data: existing } = await supabase
      .from("event_reservations")
      .select("guests_count")
      .eq("event_id", event_id)
      .eq("status", "confirmed");

    const total = (existing ?? []).reduce((sum, r) => sum + (r.guests_count ?? 1), 0);
    if (total + (guests_count ?? 1) > event.max_guests) {
      return NextResponse.json({ error: "Plus de places disponibles pour cet événement" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("event_reservations")
    .insert({
      event_id,
      restaurant_id: event.restaurant_id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email?.trim() || null,
      guests_count: guests_count ?? 1,
      status: "confirmed",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

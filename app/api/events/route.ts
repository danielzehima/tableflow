import { NextResponse } from "next/server";
import { getSession } from "../../lib/auth-server";
import { supabase } from "../../lib/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data } = await supabase
    .from("events")
    .select("*, event_reservations(id, customer_name, customer_phone, guests_count, status)")
    .eq("restaurant_id", session.restaurantId)
    .order("event_date", { ascending: true });

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description, event_date, event_time, image_url, max_guests, price } = await req.json();

  if (!title?.trim() || !event_date || !event_time) {
    return NextResponse.json({ error: "Titre, date et heure sont obligatoires" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      restaurant_id: session.restaurantId,
      title: title.trim(),
      description: description?.trim() || null,
      event_date,
      event_time,
      image_url: image_url?.trim() || null,
      max_guests: max_guests ? Number(max_guests) : null,
      price: price ? Number(price) : 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const allowed = ["title", "description", "event_date", "event_time", "image_url", "max_guests", "price", "is_active"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key];
  }

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", session.restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", session.restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

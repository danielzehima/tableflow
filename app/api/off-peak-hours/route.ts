import { NextResponse } from "next/server";
import { getSession } from "../../lib/auth-server";
import { supabase } from "../../lib/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data } = await supabase
    .from("off_peak_hours")
    .select("*")
    .eq("restaurant_id", session.restaurantId)
    .order("start_time", { ascending: true });

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { label, start_time, end_time, discount_percent, days_of_week } = await req.json();

  if (!label?.trim() || !start_time || !end_time || !discount_percent) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }
  if (start_time >= end_time) {
    return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début" }, { status: 400 });
  }
  if (Number(discount_percent) < 1 || Number(discount_percent) > 80) {
    return NextResponse.json({ error: "La réduction doit être entre 1% et 80%" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("off_peak_hours")
    .insert({
      restaurant_id: session.restaurantId,
      label: label.trim(),
      start_time,
      end_time,
      discount_percent: Number(discount_percent),
      days_of_week: days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, enabled } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await supabase
    .from("off_peak_hours")
    .update({ enabled })
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
    .from("off_peak_hours")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", session.restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

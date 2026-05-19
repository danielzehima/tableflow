import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, customer_name, customer_phone, date, time, guests, message } = body;

  if (!restaurant_id || !customer_name || !customer_phone || !date || !time || !guests) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert({ restaurant_id, customer_name, customer_phone, date, time, guests, message })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

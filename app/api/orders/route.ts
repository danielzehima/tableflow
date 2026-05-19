import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, table_number, items, total } = body;

  if (!restaurant_id || !table_number || !items || !total) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({ restaurant_id, table_number, items, total })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

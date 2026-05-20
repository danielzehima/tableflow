import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, name } = body;

  if (!restaurant_id || !name?.trim()) {
    return NextResponse.json({ error: "restaurant_id et name requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({ restaurant_id, name: name.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Une table avec ce nom existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

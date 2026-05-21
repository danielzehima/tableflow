import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import { getSession } from "../../lib/auth-server";

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom de la table est requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({ restaurant_id: session.restaurantId, name: name.trim() })
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

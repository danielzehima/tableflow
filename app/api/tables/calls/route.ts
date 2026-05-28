import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { restaurant_id, table_number, type } = body;

  if (!restaurant_id || !table_number || !["waiter", "bill"].includes(type)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { error } = await supabase
    .from("table_calls")
    .insert({ restaurant_id, table_number, type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");
  const since = searchParams.get("since");

  if (!restaurant_id) return NextResponse.json([]);

  let query = supabase
    .from("table_calls")
    .select("id, table_number, type, status, created_at")
    .eq("restaurant_id", restaurant_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  if (since) query = query.gt("created_at", since);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie.includes("tf_session=")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await supabase
    .from("table_calls")
    .update({ status: "acknowledged" })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}

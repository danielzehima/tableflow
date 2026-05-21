import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");
  const rating = searchParams.get("rating");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 100);

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  let query = supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (rating) {
    query = query.eq("rating", parseInt(rating));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, order_id, rating, comment, customer_name } = body;

  if (!restaurant_id || !rating) {
    return NextResponse.json({ error: "restaurant_id et rating requis" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "La note doit être entre 1 et 5" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      restaurant_id,
      order_id: order_id ?? null,
      rating,
      comment: comment?.trim() || null,
      customer_name: customer_name?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

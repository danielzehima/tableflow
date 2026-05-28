import { NextResponse } from "next/server";
import { getSession } from "../../lib/auth-server";
import { supabase } from "../../lib/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("restaurant_id", session.restaurantId)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { code, type, value, min_order, max_uses, expires_at } = await req.json();

  if (!code?.trim() || !type || !value) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }
  if (!["percent", "fixed"].includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }
  if (type === "percent" && (Number(value) <= 0 || Number(value) > 100)) {
    return NextResponse.json({ error: "Le pourcentage doit être entre 1 et 100" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      restaurant_id: session.restaurantId,
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      min_order: Number(min_order ?? 0),
      max_uses: max_uses ? Number(max_uses) : null,
      expires_at: expires_at || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce code existe déjà pour votre restaurant" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

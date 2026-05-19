import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { category_id, name, description, price, available } = body;

  if (!category_id || !name || price === undefined || price === "") {
    return NextResponse.json(
      { error: "Catégorie, nom et prix sont obligatoires" },
      { status: 400 }
    );
  }

  const { data: last } = await supabase
    .from("menu_items")
    .select("position")
    .eq("category_id", category_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id,
      name,
      description: description ?? "",
      price: Number(price),
      available: available ?? true,
      position,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

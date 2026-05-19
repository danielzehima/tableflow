import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { name, address, phone, email, hours, cuisine, description, tagline, cover_image } = body;

  const update: Record<string, string> = {};
  if (name !== undefined) update.name = name;
  if (address !== undefined) update.address = address;
  if (phone !== undefined) update.phone = phone;
  if (email !== undefined) update.email = email;
  if (hours !== undefined) update.hours = hours;
  if (cuisine !== undefined) update.cuisine = cuisine;
  if (description !== undefined) update.description = description;
  if (tagline !== undefined) update.tagline = tagline;
  if (cover_image !== undefined) update.cover_image = cover_image;

  const { data, error } = await supabase
    .from("restaurants")
    .update(update)
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: restaurant, error: restError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (restError || !restaurant) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  if (catError) {
    return NextResponse.json({ error: "Erreur menu" }, { status: 500 });
  }

  const menu = (categories ?? []).map((cat) => ({
    ...cat,
    items: (cat.menu_items ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  return NextResponse.json({ ...restaurant, menu });
}

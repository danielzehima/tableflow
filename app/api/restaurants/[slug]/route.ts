import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { name, address, phone, email, hours, cuisine, description, tagline, cover_image, primary_color, welcome_message, whatsapp_number, maps_url, geniuspay_api_key, geniuspay_api_secret, currency } = body;

  const update: Record<string, string> = {};
  if (currency !== undefined && ["XOF", "EUR", "USD"].includes(currency)) update.currency = currency;
  if (name !== undefined) update.name = name;
  if (address !== undefined) update.address = address;
  if (phone !== undefined) update.phone = phone;
  if (email !== undefined) update.email = email;
  if (hours !== undefined) update.hours = hours;
  if (cuisine !== undefined) update.cuisine = cuisine;
  if (description !== undefined) update.description = description;
  if (tagline !== undefined) update.tagline = tagline;
  if (cover_image !== undefined) update.cover_image = cover_image;
  if (primary_color !== undefined) update.primary_color = primary_color;
  if (welcome_message !== undefined) update.welcome_message = welcome_message;
  if (whatsapp_number !== undefined) update.whatsapp_number = whatsapp_number;
  if (maps_url !== undefined) update.maps_url = maps_url;
  if (geniuspay_api_key?.trim()) update.geniuspay_api_key = geniuspay_api_key.trim();
  if (geniuspay_api_secret?.trim()) update.geniuspay_api_secret = geniuspay_api_secret.trim();

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

  // Ne jamais exposer les clés API sensibles
  const { geniuspay_api_key, geniuspay_api_secret, ...safeRestaurant } = restaurant;
  const hasGeniuspay = !!(geniuspay_api_key && geniuspay_api_secret);

  return NextResponse.json({ ...safeRestaurant, has_geniuspay: hasGeniuspay, menu });
}

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { asCurrency, convertAmount, type Currency } from "../../../lib/currency";

/**
 * Convertit tous les montants "restaurant" (menu, événements, codes promo)
 * de l'ancienne devise vers la nouvelle. Les commandes/paiements passés ne
 * sont PAS touchés (ils reflètent la devise au moment de la transaction).
 */
async function convertRestaurantPrices(
  restaurantId: string,
  from: Currency,
  to: Currency
): Promise<void> {
  // ── 1. Plats du menu (via les catégories du restaurant) ──
  const { data: cats } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("restaurant_id", restaurantId);
  const catIds = (cats ?? []).map((c) => c.id);
  if (catIds.length) {
    const { data: items } = await supabase
      .from("menu_items")
      .select("id, price")
      .in("category_id", catIds);
    await Promise.all(
      (items ?? []).map((it) =>
        supabase
          .from("menu_items")
          .update({ price: convertAmount(Number(it.price), from, to) })
          .eq("id", it.id)
      )
    );
  }

  // ── 2. Événements ──
  const { data: events } = await supabase
    .from("events")
    .select("id, price")
    .eq("restaurant_id", restaurantId);
  await Promise.all(
    (events ?? [])
      .filter((e) => Number(e.price) > 0)
      .map((e) =>
        supabase
          .from("events")
          .update({ price: convertAmount(Number(e.price), from, to) })
          .eq("id", e.id)
      )
  );

  // ── 3. Codes promo (montant fixe + commande minimum) ──
  const { data: promos } = await supabase
    .from("promo_codes")
    .select("id, type, value, min_order")
    .eq("restaurant_id", restaurantId);
  await Promise.all(
    (promos ?? []).map((p) =>
      supabase
        .from("promo_codes")
        .update({
          value: p.type === "fixed" ? convertAmount(Number(p.value), from, to) : p.value,
          min_order: convertAmount(Number(p.min_order), from, to),
        })
        .eq("id", p.id)
    )
  );
}

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

  // ── Détection d'un changement de devise → conversion des prix ──
  let conversion: { from: Currency; to: Currency; id: string } | null = null;
  if (update.currency) {
    const { data: current } = await supabase
      .from("restaurants")
      .select("id, currency")
      .eq("slug", slug)
      .single();
    const from = asCurrency(current?.currency);
    const to = asCurrency(update.currency);
    if (current && from !== to) {
      conversion = { from, to, id: current.id as string };
    }
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update(update)
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convertir les prix APRÈS la mise à jour de la devise (non bloquant en cas d'échec partiel)
  if (conversion) {
    await convertRestaurantPrices(conversion.id, conversion.from, conversion.to);
  }

  return NextResponse.json({ ...data, converted: !!conversion });
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

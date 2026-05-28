import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import {
  sendReservationConfirmation,
  sendNewReservationAlert,
} from "../../lib/email";

export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, customer_name, customer_phone, customer_email, date, time, guests, message } = body;
  console.log(`[Réservation POST] email="${customer_email}" phone="${customer_phone}" restaurant="${restaurant_id}"`);

  if (!restaurant_id || !customer_name || !customer_phone || !date || !time || !guests) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert({ restaurant_id, customer_name, customer_phone, customer_email: customer_email || null, date, time, guests, message })
    .select()
    .single();

  if (error) {
    console.error(`[Réservation POST] Erreur insert: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notifications
  const { data: restaurant, error: restErr } = await supabase
    .from("restaurants")
    .select("name, whatsapp_number")
    .eq("id", restaurant_id)
    .single();

  console.log(`[Réservation POST] restaurant trouvé: ${restaurant?.name ?? "NULL"} — erreur: ${restErr?.message ?? "aucune"}`);

  if (restaurant) {
    await Promise.allSettled([
      sendReservationConfirmation({
        customerEmail: customer_email ?? "",
        customerPhone: customer_phone,
        customerName: customer_name,
        restaurantName: restaurant.name,
        date,
        time,
        guests,
      }),
      sendNewReservationAlert({
        restaurantWhatsapp: restaurant.whatsapp_number ?? "",
        restaurantName: restaurant.name,
        customerName: customer_name,
        customerPhone: customer_phone,
        date,
        time,
        guests,
        message,
      }),
    ]);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import { sendWhatsAppNotification } from "../../lib/whatsapp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const since = searchParams.get("since");
  const period = searchParams.get("period");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 500);

  let query = supabase
    .from("orders")
    .select("*, payments(method, status)")
    .eq("restaurant_id", restaurant_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("created_at", since);
  } else if (period) {
    const now = new Date();
    let from: Date;
    if (period === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      from = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    }
    query = query.gte("created_at", from.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { restaurant_id, table_number, items, total, customer_name, customer_phone, customer_email, promo_code, discount_amount } = body;

  if (!restaurant_id || !table_number || !items || !total) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      restaurant_id, table_number, items, total, status: "pending",
      customer_name: customer_name || "",
      customer_phone: customer_phone || "",
      promo_code: promo_code || null,
      discount_amount: discount_amount || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sauvegarder le client si téléphone ou email fourni
  if (customer_phone?.trim() || customer_email?.trim()) {
    const phone = customer_phone?.trim() || "";
    const email = customer_email?.trim() || null;
    const name = customer_name?.trim() || "Client";
    const now = new Date().toISOString();
    const query = phone
      ? supabase.from("customers").select("id, order_count").eq("restaurant_id", restaurant_id).eq("phone", phone).single()
      : supabase.from("customers").select("id, order_count").eq("restaurant_id", restaurant_id).eq("email", email!).single();
    const { data: existing } = await query;
    if (existing) {
      await supabase.from("customers").update({ name, last_order_at: now, order_count: existing.order_count + 1, ...(email ? { email } : {}) }).eq("id", existing.id);
    } else {
      await supabase.from("customers").insert({ restaurant_id, name, phone: phone || null, email, order_count: 1, last_order_at: now });
    }
  }

  // Incrémenter uses_count du code promo — non bloquant
  if (promo_code) {
    supabase
      .from("promo_codes")
      .select("id, uses_count")
      .eq("restaurant_id", restaurant_id)
      .eq("code", promo_code)
      .single()
      .then(({ data: promo }) => {
        if (promo) {
          supabase.from("promo_codes").update({ uses_count: promo.uses_count + 1 }).eq("id", promo.id);
        }
      });
  }

  // Points de fidélité — non bloquant
  if (customer_phone?.trim()) {
    const { data: resto } = await supabase
      .from("restaurants")
      .select("loyalty_enabled, loyalty_points_per_order")
      .eq("id", restaurant_id)
      .single();

    if (resto?.loyalty_enabled) {
      const phone = customer_phone.trim();
      const { data: cust } = await supabase
        .from("customers")
        .select("id, loyalty_points")
        .eq("restaurant_id", restaurant_id)
        .eq("phone", phone)
        .single();

      if (cust) {
        const earned = resto.loyalty_points_per_order ?? 1;
        await supabase
          .from("customers")
          .update({ loyalty_points: cust.loyalty_points + earned })
          .eq("id", cust.id);
        await supabase.from("loyalty_transactions").insert({
          restaurant_id,
          customer_id: cust.id,
          order_id: data.id,
          points: earned,
          type: "earned",
          description: `Commande table ${table_number}`,
        });
      }
    }
  }

  // Notification WhatsApp — non bloquante
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("whatsapp_number, name")
    .eq("id", restaurant_id)
    .single();

  if (restaurant?.whatsapp_number) {
    const totalFormatted = new Intl.NumberFormat("fr-FR").format(Number(total));
    const msg =
      `🔔 *Nouvelle commande — ${restaurant.name}*\n\n` +
      `🍽️ Table : ${table_number}\n` +
      `📋 Articles : ${items}\n` +
      `💰 Total : ${totalFormatted} FCFA`;
    await sendWhatsAppNotification(restaurant.whatsapp_number, msg);
  }

  return NextResponse.json(data, { status: 201 });
}

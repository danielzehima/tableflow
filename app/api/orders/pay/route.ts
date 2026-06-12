import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { initGeniusPayPayment } from "../../../lib/geniuspay";
import type { ProviderId } from "../../../lib/payment-providers";

/**
 * POST /api/orders/pay
 *
 * Initialise le paiement d'une commande client.
 * Utilise la config de paiement propre au restaurant (multi-tenant).
 *
 * Body : { order_id, customer_name?, customer_phone?, provider? }
 * - provider : opérateur choisi par le client (wave | orange_money | mtn_money | moov_money)
 *              Si absent, on prend le premier opérateur activé du restaurant.
 */
export async function POST(req: Request) {
  const body = await req.json() as {
    order_id: string;
    customer_name?: string;
    customer_phone?: string;
    provider?: ProviderId;
  };

  const { order_id, customer_name, customer_phone, provider: requestedProvider } = body;

  if (!order_id) {
    return NextResponse.json({ error: "order_id requis" }, { status: 400 });
  }

  // ── 1. Récupérer la commande ──────────────────────────────────────────────
  const { data: order } = await supabase
    .from("orders")
    .select("id, total, table_number, restaurant_id, restaurants(name, slug, online_payment_enabled, geniuspay_api_key, geniuspay_api_secret)")
    .eq("id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const restaurant = (Array.isArray(order.restaurants)
    ? order.restaurants[0]
    : order.restaurants) as {
    name: string;
    slug: string;
    online_payment_enabled?: boolean;
    geniuspay_api_key?: string | null;
    geniuspay_api_secret?: string | null;
  } | null;

  if (!restaurant?.online_payment_enabled) {
    return NextResponse.json({ error: "Paiement en ligne non activé pour ce restaurant" }, { status: 403 });
  }

  // ── 2. Récupérer la config de paiement du restaurant ────────────────────
  const { data: paymentMethods } = await supabase
    .from("restaurant_payment_methods")
    .select("provider, enabled, merchant_id, api_key, api_secret, webhook_secret")
    .eq("restaurant_id", order.restaurant_id)
    .eq("enabled", true);

  const enabledMethods = paymentMethods ?? [];

  // Si le restaurant n'a configuré aucun opérateur spécifique, on utilise
  // ses clés GeniusPay globales (rétro-compatibilité)
  if (enabledMethods.length === 0) {
    return handleGeniusPay({
      order,
      restaurant,
      customerName: customer_name,
      customerPhone: customer_phone,
    });
  }

  // ── 3. Choisir l'opérateur ──────────────────────────────────────────────
  let method = requestedProvider
    ? enabledMethods.find((m) => m.provider === requestedProvider)
    : enabledMethods[0]; // défaut : premier opérateur activé

  if (!method) {
    // L'opérateur demandé n'est pas activé — on prend le premier disponible
    method = enabledMethods[0];
  }

  // ── 4. Router vers le bon processeur ────────────────────────────────────
  // Pour l'instant tous les opérateurs passent par GeniusPay qui les supporte.
  // Quand une intégration directe est disponible pour un opérateur, ajouter
  // un case ici (ex: case "wave": return handleWaveDirect(...))
  return handleGeniusPay({
    order,
    restaurant,
    customerName: customer_name,
    customerPhone: customer_phone,
    // Utiliser les clés spécifiques de l'opérateur si dispo, sinon celles du restaurant
    apiKey:    method.api_key    || restaurant.geniuspay_api_key  || undefined,
    apiSecret: method.api_secret || restaurant.geniuspay_api_secret || undefined,
    provider:  method.provider as ProviderId,
  });
}

// ── Processeur GeniusPay ──────────────────────────────────────────────────────
async function handleGeniusPay({
  order,
  restaurant,
  customerName,
  customerPhone,
  apiKey,
  apiSecret,
  provider = "wave",
}: {
  order: { id: string; total: number | string; table_number: string; restaurant_id: string };
  restaurant: { name: string; slug: string; geniuspay_api_key?: string | null; geniuspay_api_secret?: string | null };
  customerName?: string;
  customerPhone?: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  provider?: ProviderId;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tableflow-gilt.vercel.app";

  const result = await initGeniusPayPayment({
    amount: Number(order.total),
    description: `Commande Table ${order.table_number} — ${restaurant.name}`,
    returnUrl: `${appUrl}/${restaurant.slug}?paid=1&order_id=${order.id}`,
    customerName: customerName || "Client",
    customerPhone,
    metadata: {
      order_id: order.id,
      restaurant_id: order.restaurant_id,
      provider,
    },
    apiKey:    apiKey    ?? restaurant.geniuspay_api_key,
    apiSecret: apiSecret ?? restaurant.geniuspay_api_secret,
  });

  if (!result.success || !result.data?.checkout_url) {
    return NextResponse.json({ error: result.message ?? "Erreur paiement" }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("payments").insert({
    restaurant_id: order.restaurant_id,
    order_id: order.id,
    plan: "order",
    amount: Number(order.total),
    currency: "XOF",
    method: provider,
    status: "pending",
    reference: result.data.reference,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ payment_url: result.data.checkout_url });
}

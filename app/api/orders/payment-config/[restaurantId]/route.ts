import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { PROVIDERS, type PublicPaymentMethod } from "../../../../lib/payment-providers";

/**
 * GET /api/orders/payment-config/[restaurantId]
 *
 * Retourne les méthodes de paiement ACTIVÉES pour un restaurant,
 * sans aucune clé API — destiné à être appelé côté client (page publique).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;
  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId requis" }, { status: 400 });
  }

  // 1. Méthodes activées dans restaurant_payment_methods
  const { data: methods } = await supabase
    .from("restaurant_payment_methods")
    .select("provider")
    .eq("restaurant_id", restaurantId)
    .eq("enabled", true);

  // 2. Le restaurant a-t-il activé le paiement en ligne ?
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("online_payment_enabled")
    .eq("id", restaurantId)
    .single();

  const onlinePaymentEnabled = (restaurant as { online_payment_enabled?: boolean } | null)
    ?.online_payment_enabled ?? false;

  if (!onlinePaymentEnabled) {
    return NextResponse.json({ enabled: false, methods: [] });
  }

  const enabledProviderIds = new Set((methods ?? []).map((m) => m.provider));

  const publicMethods: PublicPaymentMethod[] = PROVIDERS
    .filter((p) => enabledProviderIds.has(p.id))
    .map((p) => ({
      provider:  p.id,
      name:      p.name,
      shortName: p.shortName,
      color:     p.color,
      logo:      p.logo,
    }));

  return NextResponse.json({
    enabled: true,
    methods: publicMethods,
  });
}

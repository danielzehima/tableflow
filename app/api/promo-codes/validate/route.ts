import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { formatMoney, roundMoney } from "../../../lib/currency";

export async function POST(req: Request) {
  const { restaurant_id, code, total } = await req.json();

  if (!restaurant_id || !code || total === undefined) {
    return NextResponse.json({ valid: false, message: "Paramètres manquants" }, { status: 400 });
  }

  const { data: resto } = await supabase
    .from("restaurants")
    .select("currency")
    .eq("id", restaurant_id)
    .single();
  const currency = resto?.currency ?? "XOF";

  const { data: promo } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (!promo) {
    return NextResponse.json({ valid: false, message: "Code promo invalide ou inactif" });
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, message: "Ce code promo a expiré" });
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ valid: false, message: "Ce code promo est épuisé" });
  }
  if (Number(total) < Number(promo.min_order)) {
    return NextResponse.json({
      valid: false,
      message: `Commande minimum requise : ${formatMoney(Number(promo.min_order), currency)}`,
    });
  }

  let discount_amount = 0;
  if (promo.type === "percent") {
    discount_amount = roundMoney((Number(total) * Number(promo.value)) / 100, currency);
  } else {
    discount_amount = Math.min(Number(promo.value), Number(total));
  }

  return NextResponse.json({
    valid: true,
    type: promo.type,
    value: promo.value,
    discount_amount,
    code: promo.code,
  });
}

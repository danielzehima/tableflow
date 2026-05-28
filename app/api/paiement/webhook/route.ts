import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabase } from "../../../lib/supabase-server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Vérification signature HMAC-SHA256
  const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET ?? "";
  if (webhookSecret) {
    const signature = req.headers.get("x-webhook-signature") ?? "";
    const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
    const expected = createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
    // Rejeter les webhooks vieux de plus de 5 minutes
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
      return NextResponse.json({ error: "Webhook expiré" }, { status: 401 });
    }
  }

  let body: { event?: string; data?: { reference?: string; status?: string } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const event = body.event ?? req.headers.get("x-webhook-event") ?? "";
  const reference = body.data?.reference ?? "";

  if (!reference) return NextResponse.json({ ok: true });

  if (event === "payment.failed" || event === "payment.cancelled" || event === "payment.expired") {
    await supabase.from("payments").update({ status: "failed" }).eq("reference", reference);
    return NextResponse.json({ ok: true });
  }

  if (event !== "payment.success") return NextResponse.json({ ok: true });

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .single();

  if (!payment) return NextResponse.json({ ok: true });

  await supabase.from("payments").update({ status: "success" }).eq("reference", reference);

  // Abonnement : activer le plan du restaurant
  if (payment.plan && payment.plan !== "order") {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await supabase
      .from("restaurants")
      .update({ plan: payment.plan, plan_expires_at: expiresAt.toISOString(), status: "active" })
      .eq("id", payment.restaurant_id);
  }

  // Commande client : passer le statut à "paid"
  if (payment.order_id) {
    await supabase.from("orders").update({ status: "paid" }).eq("id", payment.order_id);
  }

  return NextResponse.json({ ok: true });
}

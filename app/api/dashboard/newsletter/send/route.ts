import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { getSession } from "../../../../lib/auth-server";
import { sendNewsletterEmail } from "../../../../lib/email";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { subject, body_text } = await req.json();
  if (!subject?.trim() || !body_text?.trim()) {
    return NextResponse.json({ error: "Sujet et message requis" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("id", session.restaurantId)
    .single();

  const { data: customers } = await supabase
    .from("customers")
    .select("email, name")
    .eq("restaurant_id", session.restaurantId)
    .not("email", "is", null)
    .neq("email", "");

  if (!customers || customers.length === 0) {
    return NextResponse.json({ error: "Aucun abonné avec une adresse email" }, { status: 400 });
  }

  const restaurantName = restaurant?.name ?? "Le restaurant";

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const customer of customers) {
    if (!customer.email) continue;
    const result = await sendNewsletterEmail({
      to: customer.email,
      toName: customer.name || undefined,
      subject: subject.trim(),
      bodyText: body_text.trim(),
      restaurantName,
    });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      if (result.error && !errors.includes(result.error)) {
        errors.push(result.error);
      }
    }
  }

  if (sent > 0) {
    await supabase.from("newsletter_campaigns").insert({
      restaurant_id: session.restaurantId,
      subject: subject.trim(),
      body_text: body_text.trim(),
      recipient_count: sent,
    });
  }

  return NextResponse.json({ sent, failed, errors });
}

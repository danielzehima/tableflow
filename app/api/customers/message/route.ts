import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";
import { sendWhatsAppNotification } from "../../../lib/whatsapp";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { phones, message } = await req.json();

  if (!phones?.length || !message?.trim()) {
    return NextResponse.json({ error: "Destinataires et message requis" }, { status: 400 });
  }

  // Récupérer les noms pour personnaliser {nom}
  const { data: customers } = await supabase
    .from("customers")
    .select("phone, name")
    .eq("restaurant_id", session.restaurantId)
    .in("phone", phones);

  const nameMap: Record<string, string> = {};
  for (const c of customers ?? []) nameMap[c.phone] = c.name;

  let sent = 0;
  for (const phone of phones as string[]) {
    const nom = nameMap[phone] ?? "Client";
    const personalizedMessage = message.replace(/\{nom\}/gi, nom);
    try {
      await sendWhatsAppNotification(phone, personalizedMessage);
      sent++;
    } catch {
      // continue même si un envoi échoue
    }
  }

  return NextResponse.json({ sent, total: phones.length });
}

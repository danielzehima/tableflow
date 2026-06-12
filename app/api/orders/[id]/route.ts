import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";
import { sendWhatsAppNotification } from "../../../lib/whatsapp";
import { sendPushToStaff } from "../../../lib/push";

const VALID_STATUSES = ["pending", "preparing", "ready", "served", "paid", "cancelled"];

// Rôles "de service" alertés quand un plat est prêt (pas le cuisinier)
const SERVING_ROLES = ["owner", "manager", "waiter"];

/**
 * Alerte le personnel de service qu'une commande est prête à servir.
 * Deux canaux, tous deux non bloquants :
 *  - Web Push (PWA) vers les appareils abonnés des rôles de service
 *  - WhatsApp vers les serveurs ayant renseigné un numéro
 */
async function notifyReady(
  restaurantId: string,
  order: { table_number: string; items: string }
): Promise<void> {
  try {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", restaurantId)
      .single();

    const restoName = restaurant?.name ?? "Restaurant";

    // ── Canal 1 : Web Push ──
    await sendPushToStaff(
      restaurantId,
      {
        title: `🍽️ Table ${order.table_number} — plat prêt`,
        body: `${order.items} — à servir`,
        url: "/dashboard/commandes",
      },
      SERVING_ROLES
    );

    // ── Canal 2 : WhatsApp aux serveurs ayant un numéro ──
    const { data: staff } = await supabase
      .from("restaurant_users")
      .select("phone, role, active")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .in("role", SERVING_ROLES);

    const numbers = (staff ?? [])
      .map((s) => (s.phone || "").trim())
      .filter((p) => p.length >= 6);

    if (numbers.length) {
      const msg =
        `🍽️ *Plat prêt — ${restoName}*\n\n` +
        `Table : ${order.table_number}\n` +
        `Articles : ${order.items}\n\n` +
        `👉 À récupérer en cuisine et à servir.`;
      await Promise.all(numbers.map((n) => sendWhatsAppNotification(n, msg)));
    }
  } catch {
    // une notification ne doit jamais faire échouer le changement de statut
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Vérifier que la commande appartient au restaurant de l'utilisateur connecté
  const { data: existing } = await supabase
    .from("orders")
    .select("restaurant_id, status")
    .eq("id", id)
    .single();

  if (!existing || existing.restaurant_id !== session.restaurantId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transition vers "prêt" (et pas un simple re-enregistrement) → alerter le service
  if (status === "ready" && existing.status !== "ready") {
    await notifyReady(existing.restaurant_id, {
      table_number: data.table_number,
      items: data.items,
    });
  }

  return NextResponse.json(data);
}

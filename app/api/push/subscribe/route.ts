import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

export const dynamic = "force-dynamic";

// POST /api/push/subscribe — enregistre (ou met à jour) un abonnement Web Push
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sub = await req.json().catch(() => null);
  const endpoint: string | undefined = sub?.endpoint;
  const p256dh: string | undefined = sub?.keys?.p256dh;
  const auth: string | undefined = sub?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  // upsert sur l'endpoint (un même appareil ne crée pas de doublon)
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        restaurant_id: session.restaurantId,
        user_id: session.userId,
        role: session.role,
        endpoint,
        p256dh,
        auth,
      },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — désabonne un endpoint
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({ endpoint: undefined }));
  if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 });

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}

// ================================================================
// TableFlow — Envoi de notifications Web Push (PWA)
// Utilisé côté serveur pour alerter le personnel même app fermée.
// ================================================================

import webpush from "web-push";
import { supabase } from "./supabase-server";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@tableflow.app";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Envoie une notification push à tous les abonnés correspondants.
 * - restaurantId : restaurant concerné
 * - roles        : rôles ciblés (ex: serveurs). Si omis → tout le restaurant.
 * Les abonnements expirés (404/410) sont automatiquement purgés.
 * Ne bloque jamais l'appelant : les erreurs sont avalées.
 */
export async function sendPushToStaff(
  restaurantId: string,
  payload: PushPayload,
  roles?: string[]
): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("restaurant_id", restaurantId);

    if (roles && roles.length) {
      query = query.in("role", roles);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return;

    const body = JSON.stringify(payload);
    const staleIds: string[] = [];

    await Promise.all(
      (data as SubRow[]).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          // 404 / 410 : abonnement expiré → à supprimer
          if (code === 404 || code === 410) staleIds.push(sub.id);
        }
      })
    );

    if (staleIds.length) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }
  } catch {
    // l'échec d'une notification ne doit jamais casser le flux appelant
  }
}

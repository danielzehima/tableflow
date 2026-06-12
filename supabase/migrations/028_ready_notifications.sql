-- ================================================================
-- MIGRATION 028 : Notifications "plat prêt" au serveur
--   1. Numéro de téléphone par membre d'équipe (WhatsApp ciblé)
--   2. Abonnements Web Push (PWA) par utilisateur / appareil
-- ================================================================

-- ── 1. Téléphone du collaborateur (pour la notification WhatsApp) ──
ALTER TABLE restaurant_users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 2. Abonnements Web Push ───────────────────────────────────────
-- Un enregistrement = un appareil/navigateur abonné aux notifications.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES restaurant_users(id) ON DELETE CASCADE,
  role           TEXT,                       -- rôle au moment de l'abonnement (filtrage rapide)
  endpoint       TEXT NOT NULL,
  p256dh         TEXT NOT NULL,
  auth           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- L'endpoint identifie de façon unique un abonnement push.
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx
  ON push_subscriptions(endpoint);

-- Récupérer rapidement les abonnés d'un restaurant.
CREATE INDEX IF NOT EXISTS push_subscriptions_restaurant_idx
  ON push_subscriptions(restaurant_id);

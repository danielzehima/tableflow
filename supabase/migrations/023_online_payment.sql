-- ================================================================
-- MIGRATION 023 : Paiement en ligne par les clients finaux (B2B2C)
-- ================================================================

-- Activer/désactiver le paiement Mobile Money sur la page publique
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT false;

-- Clés API GeniusPay propres à chaque restaurant
-- (peuvent déjà exister — IF NOT EXISTS les ignore)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS geniuspay_api_key    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS geniuspay_api_secret TEXT DEFAULT NULL;

-- Index pour les restaurants ayant le paiement activé
CREATE INDEX IF NOT EXISTS restaurants_online_payment_idx
  ON restaurants(online_payment_enabled)
  WHERE online_payment_enabled = true;

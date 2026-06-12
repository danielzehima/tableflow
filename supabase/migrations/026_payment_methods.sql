-- ================================================================
-- MIGRATION 026 : Méthodes de paiement par restaurant (multi-tenant)
-- Chaque restaurant configure ses propres opérateurs Mobile Money
-- ================================================================

CREATE TABLE IF NOT EXISTS restaurant_payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Identifiant de l'opérateur
  provider        TEXT NOT NULL
                    CHECK (provider IN ('wave', 'orange_money', 'mtn_money', 'moov_money')),

  -- Activation par le restaurant
  enabled         BOOLEAN NOT NULL DEFAULT false,

  -- Identifiants propres au restaurant (stockés côté serveur uniquement)
  merchant_id     TEXT,
  api_key         TEXT,
  api_secret      TEXT,
  webhook_secret  TEXT,

  -- Champs supplémentaires spécifiques à certains opérateurs (ex: shortcode MTN)
  extra_config    JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un seul enregistrement par opérateur par restaurant
  UNIQUE (restaurant_id, provider)
);

-- Index pour la lecture rapide au moment du paiement
CREATE INDEX IF NOT EXISTS rpm_restaurant_enabled_idx
  ON restaurant_payment_methods (restaurant_id, enabled)
  WHERE enabled = true;

-- Pré-remplir les 4 lignes (désactivées) pour chaque restaurant existant
INSERT INTO restaurant_payment_methods (restaurant_id, provider, enabled)
SELECT r.id, p.provider, false
FROM restaurants r
CROSS JOIN (
  VALUES ('wave'), ('orange_money'), ('mtn_money'), ('moov_money')
) AS p(provider)
ON CONFLICT (restaurant_id, provider) DO NOTHING;

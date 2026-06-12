-- ================================================================
-- MIGRATION 027 : Historique des campagnes newsletter
-- ================================================================

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  body_text       TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_campaigns_restaurant_idx
  ON newsletter_campaigns (restaurant_id, sent_at DESC);

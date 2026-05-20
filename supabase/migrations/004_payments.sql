-- ================================================================
-- MIGRATION: Historique des paiements
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'FCFA',
  method        TEXT NOT NULL CHECK (method IN ('wave', 'orange_money', 'free_money', 'carte')),
  phone         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'success', 'failed')),
  reference     TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_restaurant_idx ON payments(restaurant_id, created_at DESC);

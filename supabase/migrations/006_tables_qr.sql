-- ================================================================
-- MIGRATION: Tables de restaurant avec QR codes
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_tables_restaurant_idx
  ON restaurant_tables(restaurant_id);

-- Unicité : pas deux tables avec le même nom dans un restaurant
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_tables_name_unique_idx
  ON restaurant_tables(restaurant_id, name);

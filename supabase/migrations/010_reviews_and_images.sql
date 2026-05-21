-- ================================================================
-- MIGRATION: Tables reviews et restaurant_images
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Table des avis clients
CREATE TABLE IF NOT EXISTS reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating           INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT,
  customer_name    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_restaurant_idx ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_created_idx ON reviews(created_at DESC);

-- 2. Table des photos de galerie du restaurant
CREATE TABLE IF NOT EXISTS restaurant_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  position         INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_images_restaurant_idx ON restaurant_images(restaurant_id);

-- 3. Bucket Storage pour les photos (à faire dans Supabase Dashboard → Storage)
-- Créer un bucket public nommé : restaurant-images

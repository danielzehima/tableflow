-- ================================================================
-- MIGRATION: Orders - Realtime + normalisation des statuts
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

-- Créer la table orders si elle n'existe pas
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number  TEXT NOT NULL,
  items         TEXT NOT NULL,
  total         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending',
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supprimer l'ancienne contrainte CHECK (statuts en français)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Migrer les anciens statuts en français vers l'anglais
UPDATE orders SET status = 'pending'   WHERE status = 'En cours';
UPDATE orders SET status = 'served'    WHERE status = 'Servi';
UPDATE orders SET status = 'paid'      WHERE status = 'Payé';
UPDATE orders SET status = 'cancelled' WHERE status = 'Annulé';

-- Ajouter les colonnes manquantes si la table existait déjà
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ajouter la nouvelle contrainte avec les valeurs anglaises
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'));

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS orders_restaurant_idx ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- Activer Supabase Realtime sur la table orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

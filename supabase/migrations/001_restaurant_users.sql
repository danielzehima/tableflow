-- ================================================================
-- MIGRATION: Authentification gérants de restaurant
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS restaurant_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'waiter'
                     CHECK (role IN ('owner', 'manager', 'waiter', 'cashier')),
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un email est unique sur toute la plateforme
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_users_email_idx
  ON restaurant_users(email);

-- Index pour récupérer les membres d'un restaurant
CREATE INDEX IF NOT EXISTS restaurant_users_restaurant_idx
  ON restaurant_users(restaurant_id);

-- ================================================================
-- Rôles et permissions :
--   owner    → accès total (créé automatiquement à l'inscription)
--   manager  → menu, réservations, commandes, stats. Pas équipe.
--   waiter   → réservations + commandes uniquement
--   cashier  → commandes uniquement
-- ================================================================

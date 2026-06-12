-- ================================================================
-- MIGRATION 029 : Devise par restaurant (FCFA / EUR / USD)
-- Concerne uniquement l'argent du restaurant (menu, commandes, reçus).
-- La facturation des abonnements TableFlow reste en FCFA.
-- ================================================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XOF'
    CHECK (currency IN ('XOF', 'EUR', 'USD'));

-- Les restaurants existants conservent FCFA (XOF) par défaut.
UPDATE restaurants SET currency = 'XOF' WHERE currency IS NULL;

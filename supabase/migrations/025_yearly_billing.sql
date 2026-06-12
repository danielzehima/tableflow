-- ================================================================
-- MIGRATION 025 : Facturation annuelle
-- ================================================================

-- Prix annuel total sur les plans (ce que le client paie en une fois)
-- Starter : 9 900 × 12 = 118 800 FCFA (pas de remise)
-- Pro     : 24 900 × 12 × 0.80 = 238 080 FCFA (20% remise)
ALTER TABLE plan_settings
  ADD COLUMN IF NOT EXISTS price_yearly INTEGER NOT NULL DEFAULT 0;

UPDATE plan_settings SET price_yearly = 118800 WHERE plan = 'starter';
UPDATE plan_settings SET price_yearly = 238080 WHERE plan = 'pro';

-- Type de facturation sur les paiements pour que le webhook sache la durée
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS billing TEXT NOT NULL DEFAULT 'monthly'
  CHECK (billing IN ('monthly', 'yearly'));
